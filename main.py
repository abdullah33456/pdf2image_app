# main.py
import uvicorn
import os

# Import the FastAPI app from your app.py
# Make sure app.py defines `app = FastAPI()` at top-level
from app import app

if __name__ == "__main__":
    # Ensure outputs folder exists (optional)
    os.makedirs("outputs", exist_ok=True)

    # Run uvicorn programmatically. This avoids shell wildcard expansion issues.
    # reload_excludes tells the reloader to ignore changes in outputs/*
    uvicorn.run(
        "app:app",            # "module:app" string works the same as passing app
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_excludes=["outputs/*"],
        # you can also set reload_includes or reload_dirs if needed
    )
