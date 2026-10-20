import json
import re


def parse_llm_json(response_text: str) -> dict:
    """
    Robustly parse JSON output from LLM responses, handling markdown
    fences, surrounding text, trailing commas, and formatting variations.
    """
    if not response_text or not response_text.strip():
        raise ValueError("Empty response received from LLM.")

    text = response_text.strip()

    # 1. Direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Strip leading/trailing Markdown code blocks
    cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Extract JSON object {...} or array [...] using regex
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        extracted = match.group(1).strip()

        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

        # 4. Remove trailing commas before closing braces/brackets
        no_trailing_commas = re.sub(r",\s*([\}\]])", r"\1", extracted)

        try:
            return json.loads(no_trailing_commas)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"LLM output could not be parsed as valid JSON. Response snippet: {text[:200]}")
