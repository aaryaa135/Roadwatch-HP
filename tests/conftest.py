import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ai_service = root / "ai-service"

# Make backend and ai-service importable from the tests directory.
for path in (str(ai_service), str(root)):
    if path not in sys.path:
        sys.path.insert(0, path)
