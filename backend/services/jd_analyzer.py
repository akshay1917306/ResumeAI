from backend.services.llm_service import generate_response
from backend.utils.json_cleaner import parse_llm_json


def analyze_job_description(job_description: str):

    prompt = f"""
You are a professional Job Description Analysis Assistant.

Analyze the following job description and extract structured information.

Job Description:
----------------
{job_description}
----------------

Return ONLY a valid JSON object.

Do NOT use Markdown.
Do NOT use ```json.
Do NOT add explanations before or after the JSON.

Use exactly this structure:

{{
    "job_title": "",
    "company": "",
    "required_skills": [],
    "preferred_skills": [],
    "programming_languages": [],
    "frameworks": [],
    "databases": [],
    "tools": [],
    "experience_required": "",
    "education_required": "",
    "responsibilities": [],
    "keywords": []
}}

Rules:
1. Extract only information present in the job description.
2. Do not invent requirements.
3. Separate required skills from preferred skills when possible.
4. Extract technical and non-technical requirements.
5. Extract important keywords.
6. If information is unavailable, return an empty value.
7. Return ONLY valid JSON.
"""

    response = generate_response(prompt)

    try:
        return parse_llm_json(response)
    except ValueError as error:
        print("================================")
        print("JD JSON ERROR:", error)
        print("LLM RESPONSE:", response)
        print("================================")
        raise ValueError(f"LLM did not return valid JD JSON: {error}")