
"""
Scheduled background monitoring for Guardian AI.

Runs the continuous claim-monitoring scan on a fixed interval so
approved claims are re-checked automatically when facts or sources
change, instead of waiting for a manual admin trigger.

The scheduler is disabled unless MONITORING_INTERVAL_MINUTES is set
to a positive integer, so tests and local development are unaffected.
"""

import logging
import os

logger = logging.getLogger("guardian-ai.scheduler")

_scheduler = None


def _monitoring_job():
    """
    Open a database session and run one monitoring scan.
    """
    from backend.db.database import SessionLocal
    from backend.rules.monitoring import run_monitoring

    db = SessionLocal()

    try:
        result = run_monitoring(db)

        logger.info(
            "Scheduled monitoring completed: "
            "checked=%s alerts_created=%s",
            result.get("claims_checked"),
            result.get("alerts_created"),
        )

    except Exception:
        db.rollback()
        logger.exception("Scheduled monitoring run failed")

    finally:
        db.close()


def get_monitoring_interval_minutes() -> int:
    raw_value = os.getenv("MONITORING_INTERVAL_MINUTES", "0")

    try:
        interval = int(raw_value)
    except (TypeError, ValueError):
        logger.warning(
            "Invalid MONITORING_INTERVAL_MINUTES value %r; "
            "scheduled monitoring is disabled.",
            raw_value,
        )
        return 0

    return max(interval, 0)


def start_monitoring_scheduler():
    """
    Start the background monitoring scheduler if enabled.
    """
    global _scheduler

    interval = get_monitoring_interval_minutes()

    if interval <= 0:
        logger.info(
            "Scheduled monitoring is disabled "
            "(set MONITORING_INTERVAL_MINUTES to enable it)."
        )
        return

    if _scheduler is not None:
        return

    from apscheduler.schedulers.background import BackgroundScheduler

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        _monitoring_job,
        trigger="interval",
        minutes=interval,
        id="guardian-monitoring",
        replace_existing=True,
    )
    _scheduler.start()

    logger.info(
        "Scheduled monitoring started: running every %s minute(s).",
        interval,
    )


def shutdown_monitoring_scheduler():
    """
    Stop the background monitoring scheduler if it is running.
    """
    global _scheduler

    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduled monitoring stopped.")
