"""Structured logging setup."""
import logging


def configure_logging(level: str) -> None:
    """Configure predictable JSON-like key/value logs for the MVP."""
    logging.basicConfig(level=level.upper(), format="%(asctime)s %(levelname)s %(name)s %(message)s")
