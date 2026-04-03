from .auth_routes import router as auth_router
from .history_routes import router as history_router

__all__ = ["auth_router", "history_router"]
