from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import BaseModel

from backend.services.resume_tailor import (
    tailor_resume
)


router = APIRouter(
    prefix="/api/tailor",
    tags=["Resume Tailoring"]
)


class TailorRequest(BaseModel):

    resume_data: dict

    jd_data: dict

    match_result: dict


@router.post("")
async def tailor_resume_api(
    request: TailorRequest
):

    try:

        result = tailor_resume(
            request.resume_data,
            request.jd_data,
            request.match_result
        )


        return {

            "success": True,

            "tailoring":
                result

        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Resume tailoring failed: "
                f"{str(error)}"
            )
        )