from sqlalchemy import event
from backend.db.models import AuditLog


def record_audit(
    db,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_value=None,
    new_value=None,
    evidence=None
):
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_value=old_value,
        new_value=new_value,
        evidence=evidence
    )
    db.add(entry)
    return entry


@event.listens_for(AuditLog, "before_update")
def prevent_audit_update(mapper, connection, target):
    raise ValueError("Audit logs are append-only")


@event.listens_for(AuditLog, "before_delete")
def prevent_audit_delete(mapper, connection, target):
    raise ValueError("Audit logs cannot be deleted")