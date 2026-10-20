# ResumeAI

Upload your resume, paste a job description, and ResumeAI analyzes both, scores the match,
suggests tailoring, and generates a tailored resume as PDF and DOCX.

## Features (implemented)

- Resume upload (PDF / DOCX, max 15 MB) and AI analysis
- Job description analysis
- Skill match score with matched / missing skills
- AI tailoring suggestions
- Tailored resume generation (PDF + DOCX), including a fresh summary and a separate
  experience summary written only from the resume's real content

## Tech

- Backend: Python, FastAPI, Uvicorn
- LLM: OpenAI API (model set in `.env`)
- Frontend: plain HTML, CSS, JavaScript (Bootstrap 5)

## Setup

Requirements: Python 3.11+ and an OpenAI API key.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Open `.env` and put your own key in `LLM_API_KEY`. Never share or commit this file.

## Run

Terminal 1 (project root) - backend on http://127.0.0.1:8000:

```bash
python -m uvicorn backend.main:app --port 8000
```

Terminal 2 (`frontend` folder) - frontend on http://127.0.0.1:5500:

```bash
python -m http.server 5500
```

Open http://127.0.0.1:5500/index.html.

If you use the VS Code "Live Server" extension, tell it to ignore `uploads/**`,
`generated_resumes/**` and `outputs/**`, otherwise the page reloads while a resume is being analyzed.

## Check it works

| Action | Expected |
|---|---|
| Open http://127.0.0.1:8000/health | `{"status":"ok","service":"ResumeAI"}` |
| Upload a resume, paste a JD, click Analyze | Score, insights and tailoring suggestions appear |
| Click Generate | Tailored resume with PDF / DOCX download buttons |

## Security notes

- The API key lives only in the local `.env` (ignored by Git). The frontend never sees it.
- Uploaded and generated resumes are stored locally and ignored by Git.
- Do not use this app on a public server without adding authentication and rate limits.

## Known limitations

- Single-user local app; no login.
- Generated files use fixed names, so a new generation overwrites the previous one.
- AI output can be wrong - always review the generated resume before using it.
