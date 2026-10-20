import json

from backend.services.llm_service import generate_response
from backend.utils.json_cleaner import parse_llm_json


def generate_tailored_resume(
    resume_data: dict,
    jd_data: dict,
    match_result: dict,
    tailoring_result: dict
):

    prompt = f"""
You are an expert Resume Generation AI.

Create a professional, job-targeted resume using ONLY information already present in the candidate's resume.

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

TAILORING SUGGESTIONS:
----------------
{json.dumps(tailoring_result, indent=2)}
----------------

Return ONLY valid JSON.

Use exactly this structure:

{{
    "candidate_name": "",
    "professional_title": "",
    "summary": "",
    "skills": [],
    "experience": [],
    "experience_summary": "",
    "projects": [],
    "education": [],
    "certifications": []
}}

Rules:
1. Use ONLY information present in the candidate resume.
2. Do NOT invent skills, experience, projects, certifications, education, or job titles.
3. Improve wording where appropriate while preserving original meaning.
4. Keep the resume professional and concise.
5. Return valid JSON only.
6. "summary": write a FRESH, job-targeted summary in your own words (3-4 sentences).
   Do NOT copy or lightly rephrase the summary from the candidate resume.
   Open with the target role, then connect the candidate's real strengths to the
   job's needs, and end with the direction the candidate wants to grow in.
7. "experience_summary": write ONE separate paragraph (4-5 sentences) in the tone of a
   candidate with 0-2 years of experience, based ONLY on the candidate's real
   projects, internships, training, and coursework. If the candidate is a fresher,
   describe it as hands-on project and training experience. Do NOT invent employers,
   job titles, durations, years of experience, or achievements/metrics not in the resume.
8. "experience": keep the real entries only. Do not add fake jobs for freshers.
"""

    response = generate_response(prompt)

    try:
        return parse_llm_json(response)
    except ValueError as error:
        print("================================")
        print("RESUME GENERATOR JSON ERROR:", error)
        print("LLM RESPONSE:", response)
        print("================================")
        raise ValueError(f"LLM did not return valid generated resume JSON: {error}")