
import logging
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import Source, SourcePassage, User
from backend.pipeline.embeddings import embed_documents
from backend.services.audit import record_audit


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/sources",
    tags=["Sources"],
)


# --------------------------------------------------
# Upload limits
# --------------------------------------------------

MAX_FILE_SIZE = 15 * 1024 * 1024
MAX_PDF_PAGES = 200
MAX_TEXT_CHARACTERS = 1_000_000
MAX_PASSAGES = 500

CHUNK_SIZE = 1800
CHUNK_OVERLAP = 250


# --------------------------------------------------
# Text chunking
# --------------------------------------------------

def split_text(
    text: str,
    page_number: int | None = None,
) -> list[dict]:
    """
    Split extracted text into overlapping passages.
    Preserve the original PDF page number.
    """

    clean_text = " ".join(text.split())

    if not clean_text:
        return []

    chunks = []
    start = 0

    while start < len(clean_text):
        end = min(start + CHUNK_SIZE, len(clean_text))

        if end < len(clean_text):
            whitespace = clean_text.rfind(" ", start, end)

            if whitespace > start + CHUNK_SIZE // 2:
                end = whitespace

        content = clean_text[start:end].strip()

        if content:
            chunks.append({
                "content": content,
                "page_number": page_number,
            })

        if end >= len(clean_text):
            break

        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


# --------------------------------------------------
# File extraction
# --------------------------------------------------

def extract_file_content(
    filename: str,
    file_bytes: bytes,
) -> list[dict]:
    """
    Extract page-aware content from PDF or TXT files.
    """

    extension = Path(filename).suffix.lower()

    extracted_pages = []

    if extension == ".pdf":

        if not file_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid PDF.",
            )

        try:
            reader = PdfReader(BytesIO(file_bytes))

            if reader.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Encrypted PDFs are not supported.",
                )

            if len(reader.pages) > MAX_PDF_PAGES:
                raise HTTPException(
                    status_code=400,
                    detail=f"PDF exceeds the {MAX_PDF_PAGES}-page limit.",
                )

            for page_index, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""

                if page_text.strip():
                    extracted_pages.append({
                        "text": page_text,
                        "page_number": page_index + 1,
                    })

        except HTTPException:
            raise

        except Exception:
            logger.exception("PDF extraction failed")

            raise HTTPException(
                status_code=400,
                detail="Could not extract text from this PDF.",
            )

    elif extension == ".txt":

        try:
            text = file_bytes.decode("utf-8-sig")

        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="TXT files must use UTF-8 encoding.",
            )

        if "\x00" in text:
            raise HTTPException(
                status_code=400,
                detail="The TXT file contains invalid binary data.",
            )

        extracted_pages.append({
            "text": text,
            "page_number": None,
        })

    else:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported.",
        )

    total_characters = sum(
        len(page["text"])
        for page in extracted_pages
    )

    if total_characters == 0:
        raise HTTPException(
            status_code=400,
            detail="No extractable text was found in this document.",
        )

    if total_characters > MAX_TEXT_CHARACTERS:
        raise HTTPException(
            status_code=400,
            detail="Extracted document text exceeds the allowed limit.",
        )

    passages = []

    for page in extracted_pages:
        page_chunks = split_text(
            page["text"],
            page["page_number"],
        )

        passages.extend(page_chunks)

        if len(passages) > MAX_PASSAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Document exceeds the {MAX_PASSAGES}-passage limit.",
            )

    if not passages:
        raise HTTPException(
            status_code=400,
            detail="No usable text passages could be generated.",
        )

    return passages


# --------------------------------------------------
# ADMIN: Upload a trusted source
# --------------------------------------------------

@router.post("/upload")
def upload_source(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        filename = Path(file.filename or "").name

        if not filename or len(filename) > 255:
            raise HTTPException(
                status_code=400,
                detail="Invalid filename.",
            )

        extension = Path(filename).suffix.lower()

        if extension not in {".pdf", ".txt"}:
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TXT files are supported.",
            )

        file_bytes = file.file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File exceeds the 15 MB upload limit.",
            )

        # Extract and chunk document text.
        passages = extract_file_content(
            filename,
            file_bytes,
        )

        # Generate embeddings before opening the database transaction.
        try:
            embeddings = embed_documents(
                texts=[
                    passage["content"]
                    for passage in passages
                ],
                titles=[filename] * len(passages),
            )

        except Exception:
            logger.exception("Source embedding generation failed")

            raise HTTPException(
                status_code=502,
                detail="Could not generate document embeddings. No source was saved.",
            )

        if len(embeddings) != len(passages):
            raise HTTPException(
                status_code=502,
                detail="Embedding count does not match passage count.",
            )

        source_id = str(uuid.uuid4())

        source = Source(
            id=source_id,
            filename=filename,
            file_type=extension.lstrip("."),
            version=1,
            status="pending",
        )

        db.add(source)

        for index, (passage, embedding) in enumerate(
            zip(passages, embeddings)
        ):
            db.add(
                SourcePassage(
                    id=str(uuid.uuid4()),
                    source_id=source_id,
                    source_version=1,
                    chunk_index=index,
                    page_number=passage["page_number"],
                    content=passage["content"],
                    embedding=embedding,
                    embedding_model="gemini-embedding-2",
                )
            )

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="source.uploaded",
            entity_type="source",
            entity_id=source_id,
            new_value={
                "filename": filename,
                "file_type": extension.lstrip("."),
                "version": 1,
                "status": "pending",
                "passage_count": len(passages),
            },
        )

        db.commit()
        db.refresh(source)

        return {
            "message": "Source uploaded successfully. Admin approval is required.",
            "source_id": source.id,
            "filename": source.filename,
            "version": source.version,
            "status": source.status,
            "passage_count": len(passages),
            "embedding_model": "gemini-embedding-2",
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        logger.exception("Source upload failed")

        raise HTTPException(
            status_code=500,
            detail="Source upload failed. Check backend logs.",
        )

    finally:
        file.file.close()


# --------------------------------------------------
# ADMIN: List sources
# --------------------------------------------------

@router.get("/")
def list_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    sources = (
        db.query(Source)
        .order_by(Source.created_at.desc())
        .all()
    )

    return {
        "total": len(sources),
        "sources": [
            {
                "source_id": source.id,
                "filename": source.filename,
                "file_type": source.file_type,
                "version": source.version,
                "status": source.status,
                "created_at": (
                    source.created_at.isoformat()
                    if source.created_at
                    else None
                ),
                "passage_count": len(source.passages),
            }
            for source in sources
        ],
    }


# --------------------------------------------------
# ADMIN: Approve a pending source
# --------------------------------------------------

@router.post("/{source_id}/approve")
def approve_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        source = (
            db.query(Source)
            .filter(Source.id == source_id)
            .with_for_update()
            .first()
        )

        if not source:
            raise HTTPException(
                status_code=404,
                detail="Source not found.",
            )

        if source.status != "pending":
            raise HTTPException(
                status_code=409,
                detail=f"Source cannot be approved from status '{source.status}'.",
            )

        passage_count = (
            db.query(SourcePassage)
            .filter(
                SourcePassage.source_id == source.id,
                SourcePassage.source_version == source.version,
            )
            .count()
        )

        if passage_count == 0:
            raise HTTPException(
                status_code=409,
                detail="Source has no stored passages and cannot be approved.",
            )

        source.status = "active"

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="source.approved",
            entity_type="source",
            entity_id=source.id,
            old_value={
                "status": "pending",
            },
            new_value={
                "status": "active",
                "version": source.version,
            },
            evidence={
                "passage_count": passage_count,
            },
        )

        db.commit()
        db.refresh(source)

        return {
            "message": "Source approved successfully.",
            "source_id": source.id,
            "filename": source.filename,
            "status": source.status,
            "version": source.version,
            "passage_count": passage_count,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        logger.exception("Source approval failed")

        raise HTTPException(
            status_code=500,
            detail="Source approval failed. Check backend logs.",
        )
