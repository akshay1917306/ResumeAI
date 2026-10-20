from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import BaseModel

from backend.services.jd_analyzer import (
    analyze_job_description
)


router = APIRouter(
    prefix="/api/jd",
    tags=["Job Description"]
)


class JDRequest(BaseModel):

    job_description: str


@router.post("/analyze")
async def analyze_jd(
    request: JDRequest
):

    if not request.job_description.strip():

        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty."
        )


    if len(request.job_description) > 30000:

        raise HTTPException(
            status_code=400,
            detail="Job description is too long."
        )


    try:

        analysis = analyze_job_description(
            request.job_description
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Job description analysis failed: "
                f"{str(error)}"
            )
        )


    return {

        "success": True,

        "analysis":
            analysis

    }