import json

from backend.services.llm_service import generate_response
from backend.utils.json_cleaner import parse_llm_json


SKILL_FIELDS = (
    "skills",
    "programming_languages",
    "frameworks",
    "databases",
    "tools"
)


def normalize_skill(skill) -> str:
    return str(skill).strip().lower()


def collect_skills(data: dict) -> list:
    # The LLM spreads skills over several fields, so read all of them.
    collected = []

    for field in SKILL_FIELDS:
        values = data.get(field) or []

        if isinstance(values, list):
            collected.extend(values)

    return collected


def skills_equal(resume_skill: str, required_skill: str) -> bool:
    # Exact match, or one name contains the other ("sql" vs "sql server").
    if resume_skill == required_skill:
        return True

    shorter, longer = sorted((resume_skill, required_skill), key=len)

    return len(shorter) >= 3 and shorter in longer.split()


def calculate_skill_match(
    resume_skills: list,
    required_skills: list
):
    resume_set = {
        normalize_skill(skill)
        for skill in resume_skills
        if normalize_skill(skill)
    }

    required_set = {
        normalize_skill(skill)
        for skill in required_skills
        if normalize_skill(skill)
    }

    matched = {
        required
        for required in required_set
        if any(skills_equal(have, required) for have in resume_set)
    }
    missing = required_set.difference(matched)

    if not required_set:
        score = 0.0
    else:
        score = (len(matched) / len(required_set)) * 100

    return {
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "skill_match_score": round(score, 2)
    }


def analyze_resume_jd_match(
    resume_data: dict,
    jd_data: dict
):
    resume_skills = collect_skills(resume_data)
    required_skills = (
        (jd_data.get("required_skills") or [])
        + collect_skills(
            {k: v for k, v in jd_data.items() if k != "skills"}
        )
    )

    # Step 1 — Deterministic Skill Matching
    skill_result = calculate_skill_match(
        resume_skills,
        required_skills
    )

    # Step 2 — LLM Deeper Analysis
    prompt = f"""
You are an expert Resume Matching AI.

Compare the candidate resume profile with the job description profile.

RESUME PROFILE:
----------------
{json.dumps(resume_data, indent=2)}
----------------

JOB DESCRIPTION PROFILE:
----------------
{json.dumps(jd_data, indent=2)}
----------------

The deterministic skill matching result is:
{json.dumps(skill_result, indent=2)}

Analyze the candidate's compatibility with the job.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "matching_experience": [],
    "matching_projects": [],
    "skill_gaps": [],
    "recommendations": []
}}

Rules:
1. Use only information present in the resume.
2. Do not invent experience or projects.
3. Do not claim the candidate has a skill not present in the resume.
4. Identify experience and projects relevant to the job.
5. Identify important skill gaps.
6. Give practical resume improvement recommendations.
7. Return valid JSON only.
"""

    response = generate_response(prompt)

    try:
        llm_result = parse_llm_json(response)
    except ValueError as error:
        print("================================")
        print("MATCHING JSON ERROR:", error)
        print("LLM RESPONSE:", response)
        print("================================")
        llm_result = {}

    return {
        "match_score": skill_result["skill_match_score"],
        "matched_skills": skill_result["matched_skills"],
        "missing_skills": skill_result["missing_skills"],
        "matching_experience": llm_result.get("matching_experience", []),
        "matching_projects": llm_result.get("matching_projects", []),
        "skill_gaps": llm_result.get("skill_gaps", []),
        "recommendations": llm_result.get("recommendations", [])
    }