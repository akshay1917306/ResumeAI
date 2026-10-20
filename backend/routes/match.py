from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import BaseModel

from backend.services.matching_engine import (
    analyze_resume_jd_match
)


router = APIRouter(
    prefix="/api/match",
    tags=["Matching"]
)


class MatchRequest(BaseModel):

    resume_data: dict

    jd_data: dict


@router.post("")
async def match_resume_with_jd(
    request: MatchRequest
):

    try:

        result = analyze_resume_jd_match(
            request.resume_data,
            request.jd_data
        )


        return {

            "success": True,

            "match_result":
                result

        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Resume matching failed: "
                f"{str(error)}"
            )
        )