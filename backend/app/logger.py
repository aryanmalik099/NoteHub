from . import db
from .models import Log
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

def log_activity(action, details=None):
    user_id = None
    try:
        # Get user ID if the user is logged in
        user_id = get_jwt_identity()
    except Exception:
        # No user is logged in (e.g., during signup)
        pass

    log_entry = Log(
        user_id=user_id,
        action=action,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.session.add(log_entry)
    db.session.commit()