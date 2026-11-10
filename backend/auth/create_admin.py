from sqlalchemy import func

from backend.db.database import SessionLocal
from backend.db.models import User
from backend.services.audit import record_audit


def main():
    print("\n===== GUARDIAN AI ADMIN BOOTSTRAP =====")
    print("This script promotes an existing creator account.")
    print("It does not create a new account or change your password.\n")

    username = input("Enter your existing username: ").strip()
    email = input("Enter your registered email: ").strip()

    if not username or not email:
        print("ERROR: Username and email are required.")
        return

    db = SessionLocal()

    try:
        admin_count = (
            db.query(func.count(User.id))
            .filter(User.role == "admin")
            .scalar()
        )

        if admin_count:
            print("ERROR: An administrator already exists.")
            print("This one-time bootstrap script cannot create another.")
            return

        user = (
            db.query(User)
            .filter(
                User.username == username,
                User.email == email
            )
            .one_or_none()
        )

        if user is None:
            print("ERROR: No account matched both username and email.")
            return

        if user.role != "creator":
            print(f"ERROR: Account role is '{user.role}', not 'creator'.")
            return

        print("\nAccount matched.")
        print(f"Current role: {user.role}")
        print("New role: admin")
        print("\nType PROMOTE to confirm.")

        confirmation = input("> ").strip()

        if confirmation != "PROMOTE":
            print("Promotion cancelled. No changes made.")
            return

        old_role = user.role
        user.role = "admin"

        record_audit(
            db,
            actor_user_id=None,
            action="bootstrap_admin_promotion",
            entity_type="user",
            entity_id=user.id,
            old_value={"role": old_role},
            new_value={"role": "admin"},
            evidence={"method": "one-time local CLI bootstrap"},
        )

        db.commit()

        print("\nSUCCESS: Your existing account is now an administrator.")
        print("Your existing login credentials remain unchanged.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
