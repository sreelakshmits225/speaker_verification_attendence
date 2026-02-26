from fastapi import FastAPI
from app.core.config import settings
from app.api.api import api_router
from app.db.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for mobile LAN access)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.1"}

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve React App
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount the static directory (CSS, JS, Assets)
app.mount("/assets", StaticFiles(directory="frontend-app/dist/assets"), name="assets")

# Serve Index.html for root and unknown routes (SPA Support)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # If API call passed through (shouldn't happen due to order, but safety)
    if full_path.startswith("api"):
        return {"error": "API route not found"}
        
    # Return index.html for React Router to handle
    return FileResponse("frontend-app/dist/index.html")
