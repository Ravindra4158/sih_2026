from app.main import app
from app.api.routes.health import health


def test_health_route_is_registered() -> None:
    """Smoke-check the app boundary without invoking an HTTP server."""
    assert app.title
    assert health() == {"status": "ok"}
