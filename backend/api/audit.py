from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import AuditLog, User

router = APIRouter(prefix="/api/audit-logs", tags=["Audit History"])


@router.get("/")
def get_audit_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": log.id,
            "actor_user_id": log.actor_user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "evidence": log.evidence,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
