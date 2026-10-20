from pathlib import Path

from fastapi import (
    APIRouter,
    HTTPException
)

from fastapi.responses import (
    FileResponse
)


router = APIRouter(
    prefix="/api/download",
    tags=["Resume Download"]
)


GENERATED_DIR = Path(
    "generated_resumes"
)

GENERATED_DIR.mkdir(
    exist_ok=True
)


# ============================================================
# DOWNLOAD PDF
# ============================================================

@router.get("/pdf/{filename}")
async def download_pdf(
    filename: str
):
    safe_filename = Path(filename).name
    file_path = GENERATED_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF file not found."
        )

    if file_path.suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=safe_filename,
    )


# ============================================================
# DOWNLOAD DOCX
# ============================================================

@router.get("/docx/{filename}")
async def download_docx(
    filename: str
):
    safe_filename = Path(filename).name
    file_path = GENERATED_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="DOCX file not found."
        )

    if file_path.suffix.lower() != ".docx":
        raise HTTPException(
            status_code=400,
            detail="Invalid DOCX file."
        )

    return FileResponse(
        path=str(file_path),
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
        filename=safe_filename,
    )