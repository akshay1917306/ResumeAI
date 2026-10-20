from backend.services.llm_service import generate_response
from backend.utils.json_cleaner import parse_llm_json


def analyze_resume(resume_text: str):

    prompt = f"""
You are a professional resume analysis assistant.

Analyze the following resume and extract structured information.

Resume:
----------------
{resume_text}
----------------

Return ONLY a valid JSON object.

Do NOT use Markdown.
Do NOT use ```json.
Do NOT add explanations before or after the JSON.

Use exactly this structure:

{{
    "candidate_name": "",
    "professional_title": "",
    "summary": "",
    "skills": [],
    "programming_languages": [],
    "frameworks": [],
    "databases": [],
    "tools": [],
    "experience": [],
    "projects": [],
    "education": [],
    "certifications": []
}}

Rules:
1. Extract only information present in the resume.
2. Do not invent skills or experience.
3. Do not infer unsupported certifications.
4. If information is unavailable, return an empty string or empty array.
5. Return ONLY valid JSON.
"""

    response = generate_response(prompt)

    try:
        return parse_llm_json(response)
    except ValueError as error:
        print("================================")
        print("RESUME JSON ERROR:", error)
        print("LLM RESPONSE:", response)
        print("================================")
        raise ValueError(f"LLM did not return valid resume JSON: {error}")