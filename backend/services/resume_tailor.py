import json

from backend.services.llm_service import generate_response
from backend.utils.json_cleaner import parse_llm_json


def tailor_resume(
    resume_data: dict,
    jd_data: dict,
    match_result: dict
):
    prompt = f"""
You are an expert Resume Tailoring AI.

Your task is to provide practical suggestions for tailoring an existing candidate resume to a target job description.

IMPORTANT: You must use ONLY information already present in the candidate resume.

CANDIDATE RESUME:
----------------
{json.dumps(resume_data, indent=2)}
----------------

JOB DESCRIPTION:
----------------
{json.dumps(jd_data, indent=2)}
----------------

MATCHING RESULT:
----------------
{json.dumps(match_result, indent=2)}
----------------

Return ONLY valid JSON.

Use exactly this structure:

{{
    "summary_suggestions": [],
    "skill_priorities": [],
    "experience_suggestions": [],
    "project_suggestions": [],
    "keyword_suggestions": [],
    "overall_recommendations": []
}}

Rules:
1. Use only information present in the candidate resume.
2. Do not invent skills, experience, projects, certifications, or education.
3. Prioritize skills that already match the job.
4. Keep recommendations practical and professional.
5. Return valid JSON only.
"""

    response = generate_response(prompt)

    try:
        return parse_llm_json(response)
    except ValueError as error:
        print("================================")
        print("RESUME TAILOR JSON ERROR:", error)
        print("LLM RESPONSE:", response)
        print("================================")
        raise ValueError(f"LLM did not return valid tailoring JSON: {error}")