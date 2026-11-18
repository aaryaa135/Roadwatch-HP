import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
backend = root / "backend"
ai_service = root / "ai-service"

# Make backend, ai-service and the project root importable from the tests directory.
# The backend package modules use `from app...` imports, so `backend` must be on sys.path.
for path in (str(backend), str(ai_service), str(root)):
    if path not in sys.path:
        sys.path.insert(0, path)
