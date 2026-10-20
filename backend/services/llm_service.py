import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


# Find the ResumeAI project root
BASE_DIR = Path(__file__).resolve().parents[2]

# Explicitly load the .env from project root
ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
    override=True
)


# Read configuration
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")


# Debug information
print("================================")
print("ResumeAI ENV FILE:", ENV_FILE)
print("ResumeAI MODEL:", repr(LLM_MODEL))
print("================================")


# Validate configuration
if not LLM_API_KEY:
    raise ValueError("LLM_API_KEY is not configured.")

if not LLM_MODEL:
    raise ValueError("LLM_MODEL is not configured.")


# Create OpenAI client
client = OpenAI(
    api_key=LLM_API_KEY
)


def generate_response(prompt: str) -> str:

    try:
        if hasattr(client, "responses"):
            response = client.responses.create(
                model=LLM_MODEL,
                input=prompt
            )
            return response.output_text
    except Exception as err:
        print(f"llm_service: responses endpoint fallback due to: {err}")

    # Fallback to standard chat completions API
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content