from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.resume_generator import generate_tailored_resume
from backend.services.document_generator import (
    generate_pdf,
    generate_docx
)


router = APIRouter(
    prefix="/api/generate",
    tags=["Resume Generation"]
)


class GenerateResumeRequest(BaseModel):
    resume_data: dict
    jd_data: dict
    match_result: dict
    tailoring_result: dict


@router.post("")
async def generate_resume(request: GenerateResumeRequest):

    try:

        # =====================================================
        # STEP 1 — GENERATE TAILORED RESUME
        # =====================================================

        tailored_resume = generate_tailored_resume(
            request.resume_data,
            request.jd_data,
            request.match_result,
            request.tailoring_result
        )

        # =====================================================
        # STEP 2 — GENERATE FILES
        # =====================================================

        pdf_filename = "tailored_resume.pdf"
        docx_filename = "tailored_resume.docx"

        generate_pdf(
            tailored_resume,
            pdf_filename
        )

        generate_docx(
            tailored_resume,
            docx_filename
        )

        # =====================================================
        # STEP 3 — DOWNLOAD URLS
        # =====================================================

        download_urls = {
            "pdf": f"/api/download/pdf/{pdf_filename}",
            "docx": f"/api/download/docx/{docx_filename}"
        }

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return {
            "success": True,

            "message": "Tailored resume generated successfully.",

            "tailored_resume": tailored_resume,

            "download_urls": download_urls
        }

    except Exception as error:

        print("================================")
        print("RESUME GENERATION ERROR")
        print(str(error))
        print("================================")

        raise HTTPException(
            status_code=500,
            detail=f"Resume generation failed: {str(error)}"
        )