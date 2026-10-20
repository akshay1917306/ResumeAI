from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException
)

from backend.utils.file_validator import (
    validate_file_extension,
    validate_file_size
)

from backend.utils.text_extractor import (
    extract_resume_text
)

from backend.services.resume_analyzer import (
    analyze_resume
)


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================
# RESUME UPLOAD
# ============================================================

@router.post("/upload")
async def upload_resume(
    resume: UploadFile = File(...)
):

    if not resume.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )


    if not validate_file_extension(
        resume.filename
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )


    file_content = await resume.read()


    if not validate_file_size(
        len(file_content)
    ):

        raise HTTPException(
            status_code=400,
            detail="File size must be less than 15 MB."
        )


    file_path = (
        UPLOAD_DIR /
        Path(resume.filename).name
    )


    with open(
        file_path,
        "wb"
    ) as file:

        file.write(file_content)


    try:

        extracted_text = extract_resume_text(
            str(file_path)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Could not extract resume text: "
                f"{str(error)}"
            )
        )


    if not extracted_text.strip():

        raise HTTPException(
            status_code=400,
            detail="No readable text was found in the resume."
        )


    return {

        "success": True,

        "file_name":
            resume.filename,

        "file_size":
            len(file_content),

        "content_type":
            resume.content_type,

        "text_length":
            len(extracted_text),

        "extracted_text":
            extracted_text,

        "message":
            "Resume uploaded and text extracted successfully."

    }


# ============================================================
# RESUME AI ANALYSIS
# ============================================================

@router.post("/analyze")
async def analyze_uploaded_resume(
    resume: UploadFile = File(...)
):

    if not resume.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )


    if not validate_file_extension(
        resume.filename
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )


    file_content = await resume.read()


    if not validate_file_size(
        len(file_content)
    ):

        raise HTTPException(
            status_code=400,
            detail="File size must be less than 15 MB."
        )


    file_path = (
        UPLOAD_DIR /
        Path(resume.filename).name
    )


    with open(
        file_path,
        "wb"
    ) as file:

        file.write(file_content)


    try:

        extracted_text = extract_resume_text(
            str(file_path)
        )


        if not extracted_text.strip():

            raise HTTPException(
                status_code=400,
                detail="No readable text was found in the resume."
            )


        print(
            "Resume text extracted:",
            len(extracted_text),
            "characters"
        )


        analysis = analyze_resume(
            extracted_text
        )


        print(
            "Resume AI analysis completed."
        )


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Resume analysis error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Resume analysis failed: "
                f"{str(error)}"
            )
        )


    return {

        "success": True,

        "file_name":
            resume.filename,

        "analysis":
            analysis

    }