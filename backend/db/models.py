
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import VECTOR

from backend.db.database import Base


# ---------------------------------------
# 1. SOURCE MODEL
# Stores uploaded brand documents
# ---------------------------------------

class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    file_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    facts: Mapped[list["Fact"]] = relationship(
        back_populates="source"
    )

    passages: Mapped[list["SourcePassage"]] = relationship(
        back_populates="source",
        cascade="all, delete-orphan"
    )


# ---------------------------------------
# 2. SOURCE PASSAGE MODEL
# Stores extracted, versioned evidence chunks
# and their semantic embeddings.
# ---------------------------------------

class SourcePassage(Base):
    __tablename__ = "source_passages"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id"),
        nullable=False
    )

    source_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    page_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # PostgreSQL uses pgvector.
    # SQLite uses JSON for local development and testing.
    embedding: Mapped[list[float]] = mapped_column(
        VECTOR(768).with_variant(JSON(), "sqlite"),
        nullable=False
    )

    embedding_model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="gemini-embedding-2"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    source: Mapped["Source"] = relationship(
        back_populates="passages"
    )

    __table_args__ = (
        UniqueConstraint(
            "source_id",
            "source_version",
            "chunk_index",
            name="uq_source_passage_version_chunk"
        ),
        Index(
            "ix_source_passage_source_version",
            "source_id",
            "source_version"
        ),
    )


# ---------------------------------------
# 3. FACT MODEL
# Stores verified brand information
# ---------------------------------------

class Fact(Base):
    __tablename__ = "facts"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    value: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id"),
        nullable=False
    )

    source_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    source: Mapped["Source"] = relationship(
        back_populates="facts"
    )

    ledger_entries: Mapped[list["ClaimLedger"]] = relationship(
        back_populates="fact"
    )


# ---------------------------------------
# 4. DRAFT MODEL
# Stores submitted marketing content
# ---------------------------------------

class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="in_review"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    reviews: Mapped[list["Review"]] = relationship(
        back_populates="draft"
    )


# ---------------------------------------
# 5. REVIEW MODEL
# Stores review information
# ---------------------------------------

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    draft_id: Mapped[str] = mapped_column(
        ForeignKey("drafts.id"),
        nullable=False
    )

    submitted_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    draft: Mapped["Draft"] = relationship(
        back_populates="reviews"
    )

    claims: Mapped[list["Claim"]] = relationship(
        back_populates="review"
    )

    findings: Mapped[list["Finding"]] = relationship(
        back_populates="review"
    )


# ---------------------------------------
# 6. CLAIM MODEL
# Stores individual claims extracted from drafts
# ---------------------------------------

class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    review_id: Mapped[str] = mapped_column(
        ForeignKey("reviews.id"),
        nullable=False
    )

    claim_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending"
    )

    source_version: Mapped[int] = mapped_column(
        Integer,
        default=1
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    review: Mapped["Review"] = relationship(
        back_populates="claims"
    )

    ledger_entries: Mapped[list["ClaimLedger"]] = relationship(
        back_populates="claim"
    )

    findings: Mapped[list["Finding"]] = relationship(
        back_populates="claim"
    )


# ---------------------------------------
# 7. CLAIM LEDGER MODEL
# Links approved claims to verified facts
# ---------------------------------------

class ClaimLedger(Base):
    __tablename__ = "claim_ledger"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    claim_id: Mapped[str] = mapped_column(
        ForeignKey("claims.id"),
        nullable=False
    )

    fact_id: Mapped[str] = mapped_column(
        ForeignKey("facts.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="approved"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    claim: Mapped["Claim"] = relationship(
        back_populates="ledger_entries"
    )

    fact: Mapped["Fact"] = relationship(
        back_populates="ledger_entries"
    )

    __table_args__ = (
        UniqueConstraint(
            "claim_id",
            "fact_id",
            name="uq_claim_fact"
        ),
    )


# ---------------------------------------
# 8. USER MODEL
# Stores application users and their roles
# ---------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ---------------------------------------
# 9. FINDING MODEL
# Stores issues detected during review
# ---------------------------------------

class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    review_id: Mapped[str] = mapped_column(
        ForeignKey("reviews.id"),
        nullable=False
    )

    claim_id: Mapped[str | None] = mapped_column(
        ForeignKey("claims.id"),
        nullable=True
    )

    finding_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    severity: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    evidence: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True
    )

    suggested_edit: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    verification_status: Mapped[str] = mapped_column(
        String(50),
        default="unverified"
    )

    review: Mapped["Review"] = relationship(
        back_populates="findings"
    )

    claim: Mapped["Claim | None"] = relationship(
        back_populates="findings"
    )


# ---------------------------------------
# 10. ALERT MODEL
# Stores outdated claim notifications
# ---------------------------------------

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    claim_id: Mapped[str] = mapped_column(
        ForeignKey("claims.id"),
        nullable=False
    )

    fact_id: Mapped[str] = mapped_column(
        ForeignKey("facts.id"),
        nullable=False
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="open"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ---------------------------------------
# 11. AUDIT LOG MODEL
# Records important user and system actions
# ---------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    actor_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    entity_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    old_value: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    new_value: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    evidence: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
