// ============================================================
// ResumeAI - Frontend Application
// ============================================================

"use strict";


// ============================================================
// BACKEND API CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// BUILD MARKER
// Open the browser Console (F12). If you do not see this line,
// the browser is running an OLD cached copy of app.js.
// Fix: press Ctrl+Shift+R to hard-refresh the page.
// ============================================================

const APP_JS_VERSION = "2026-10-19-readable-resume-items";

console.log("ResumeAI app.js loaded. Version:", APP_JS_VERSION);


// ============================================================
// READABLE BACKEND ERRORS
// Turns FastAPI error JSON into a short, human-readable message.
//   {"detail":[{"loc":["body","job_description"],"msg":"Field required"}]}
//   becomes:  body.job_description: Field required
// ============================================================

function formatApiError(rawText) {

    if (!rawText) {
        return "(empty response from server)";
    }

    try {

        const parsed = JSON.parse(rawText);

        if (parsed && Array.isArray(parsed.detail)) {

            return parsed.detail
                .map(function (item) {

                    const where =
                        Array.isArray(item.loc)
                            ? item.loc.join(".")
                            : "request";

                    return where + ": " + (item.msg || "invalid value");

                })
                .join(" | ");
        }

        if (parsed && typeof parsed.detail === "string") {
            return parsed.detail;
        }

    } catch (ignored) {
        // Not JSON - fall through and show the raw text
    }

    return String(rawText).slice(0, 500);
}


// ============================================================
// APPLICATION STATE
// ============================================================

let selectedResumeFile = null;

let resumeAnalysis = null;
let jdAnalysis = null;
let matchResult = null;
let tailoringResult = null;
let generatedResume = null;


// ============================================================
// DOM INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("ResumeAI DOM loaded");
    console.log("Backend:", API_BASE_URL);
    console.log("=================================");

    initializeResumeAI();

});


// ============================================================
// INITIALIZE APPLICATION
// ============================================================

function initializeResumeAI() {

    const startButton = document.getElementById("startButton");
    const resumeLogo = document.getElementById("resumeLogo");

    const welcomeScreen = document.getElementById("welcomeScreen");
    const mainApp = document.getElementById("mainApp");

    const themeToggle = document.getElementById("themeToggle");

    const resumeFile = document.getElementById("resumeFile");
    const resumeFileInfo = document.getElementById("resumeFileInfo");

    const resumeDropZone = document.getElementById("resumeDropZone");

    const jobDescription = document.getElementById("jobDescription");
    const characterCount = document.getElementById("characterCount");

    const analyzeButton = document.getElementById("analyzeButton");

    const processingState = document.getElementById("processingState");
    const processingTitle = document.getElementById("processingTitle");
    const processingText = document.getElementById("processingText");

    const resultsSection = document.getElementById("resultsSection");
    const resultsContainer = document.getElementById("resultsContainer");


    // ========================================================
    // DEBUG DOM
    // ========================================================

    console.log("DOM CHECK:");
    console.log("startButton:", startButton);
    console.log("resumeLogo:", resumeLogo);
    console.log("welcomeScreen:", welcomeScreen);
    console.log("mainApp:", mainApp);
    console.log("resumeFile:", resumeFile);
    console.log("jobDescription:", jobDescription);
    console.log("analyzeButton:", analyzeButton);
    console.log("resultsSection:", resultsSection);


    // ========================================================
    // START RESUMEAI
    // ========================================================

    function startResumeAI(event) {

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log("Starting ResumeAI...");

        if (!welcomeScreen || !mainApp) {
            console.error(
                "welcomeScreen or mainApp not found."
            );
            return;
        }

        welcomeScreen.classList.add("exit-animation");

        setTimeout(function () {

            welcomeScreen.style.display = "none";

            mainApp.classList.remove("d-none");

            mainApp.classList.add("enter-animation");

        }, 500);
    }


    if (resumeLogo) {

        resumeLogo.addEventListener(
            "click",
            startResumeAI
        );

    }


    if (startButton) {

        startButton.type = "button";

        startButton.addEventListener(
            "click",
            startResumeAI
        );

    }


    // ========================================================
    // GLOBAL FORM SUBMIT PROTECTION
    // ========================================================

    document.addEventListener(
        "submit",
        function (event) {

            const form = event.target;

            console.log(
                "Form submission intercepted:",
                form
            );

            event.preventDefault();

        },
        true
    );


    // ========================================================
    // THEME TOGGLE
    // ========================================================

    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                document.body.classList.toggle(
                    "dark-mode"
                );

                const darkMode =
                    document.body.classList.contains(
                        "dark-mode"
                    );

                themeToggle.textContent =
                    darkMode ? "🌙" : "☀️";

            }
        );

    }


    // ========================================================
    // RESUME FILE SELECTION
    // ========================================================

    if (resumeFile) {

        resumeFile.addEventListener(
            "change",
            function () {

                const file =
                    resumeFile.files[0];

                if (!file) {

                    selectedResumeFile = null;

                    return;

                }

                validateAndSelectResume(file);

            }
        );

    }


    // ========================================================
    // DRAG & DROP
    // ========================================================

    if (resumeDropZone) {

        resumeDropZone.addEventListener(
            "dragover",
            function (event) {

                event.preventDefault();

                resumeDropZone.classList.add(
                    "drag-over"
                );

            }
        );


        resumeDropZone.addEventListener(
            "dragleave",
            function () {

                resumeDropZone.classList.remove(
                    "drag-over"
                );

            }
        );


        resumeDropZone.addEventListener(
            "drop",
            function (event) {

                event.preventDefault();

                resumeDropZone.classList.remove(
                    "drag-over"
                );

                const files =
                    event.dataTransfer.files;

                if (!files || files.length === 0) {
                    return;
                }

                validateAndSelectResume(
                    files[0]
                );

            }
        );

    }


    // ========================================================
    // RESUME VALIDATION
    // ========================================================

    function validateAndSelectResume(file) {

        const maxSize =
            15 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "Resume file is too large. Maximum allowed size is 15 MB."
            );

            selectedResumeFile = null;

            if (resumeFile) {
                resumeFile.value = "";
            }

            if (resumeFileInfo) {
                resumeFileInfo.classList.add(
                    "d-none"
                );
            }

            return;

        }


        const fileName =
            file.name.toLowerCase();

        const isPDF =
            fileName.endsWith(".pdf");

        const isDOCX =
            fileName.endsWith(".docx");


        if (!isPDF && !isDOCX) {

            alert(
                "Please upload a PDF or DOCX resume."
            );

            selectedResumeFile = null;

            if (resumeFile) {
                resumeFile.value = "";
            }

            if (resumeFileInfo) {
                resumeFileInfo.classList.add(
                    "d-none"
                );
            }

            return;

        }


        selectedResumeFile = file;


        const fileSize =
            (
                file.size /
                (1024 * 1024)
            ).toFixed(2);


        if (resumeFileInfo) {

            resumeFileInfo.innerHTML = `
                <strong>✓ Resume Selected</strong><br>
                ${escapeHTML(file.name)}<br>
                <small>${fileSize} MB</small>
            `;

            resumeFileInfo.classList.remove(
                "d-none"
            );

        }


        console.log(
            "Resume selected:",
            file.name
        );

    }


    // ========================================================
    // JOB DESCRIPTION CHARACTER COUNT
    // ========================================================

    if (
        jobDescription &&
        characterCount
    ) {

        jobDescription.addEventListener(
            "input",
            function () {

                const count =
                    jobDescription.value.length;

                characterCount.textContent =
                    `${count} characters`;

            }
        );

    }


    // ========================================================
    // ANALYZE BUTTON
    // ========================================================

    if (analyzeButton) {

        // IMPORTANT
        analyzeButton.type = "button";


        analyzeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "Analyze button clicked"
                );

                analyzeResumeAI();

            }
        );

    } else {

        console.error(
            "ERROR: analyzeButton not found."
        );

    }


    // ========================================================
    // MAIN ANALYSIS
    // Resume → JD → Match → Tailor
    // ========================================================

    // ============================================================
    // ANALYZE RESUME WITH JOB DESCRIPTION
    //
    // Flow:  1) resume  ->  2) job description  ->  3) match  ->  4) tailor
    // Every step shows its own readable error if something fails.
    // ============================================================

    const BACKEND_TIMEOUT_MS = 180000; // LLM calls can be slow: allow 3 minutes per step

    let analysisInProgress = false;


    // Shows progress text while the analysis is running
    function setProgress(title, text) {

        if (processingTitle) {
            processingTitle.textContent = title;
        }

        if (processingText) {
            processingText.textContent = text;
        }
    }


    // Builds the options for a JSON POST request
    function jsonRequest(payload) {

        return {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        };
    }


    // Calls ONE backend endpoint.
    // Returns the parsed JSON when the step succeeds.
    // Throws an Error with a readable message (naming the step) when it fails.
    async function callBackend(stepName, path, options) {

        const controller = new AbortController();

        const timer = setTimeout(
            function () {
                controller.abort();
            },
            BACKEND_TIMEOUT_MS
        );

        let response;
        let rawText;

        try {

            response = await fetch(
                API_BASE_URL + path,
                Object.assign({}, options, { signal: controller.signal })
            );

            rawText = await response.text();

        } catch (networkError) {

            if (networkError && networkError.name === "AbortError") {
                throw new Error(
                    stepName + " timed out after 3 minutes."
                );
            }

            throw new Error(
                stepName + ": cannot reach the backend at " + API_BASE_URL +
                ". Check that uvicorn is running on port 8000 " +
                "and that you opened this page from localhost or 127.0.0.1."
            );

        } finally {

            clearTimeout(timer);
        }

        if (!response.ok) {
            throw new Error(
                stepName + " failed (" + response.status + "): " +
                formatApiError(rawText)
            );
        }

        let data;

        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            throw new Error(
                stepName + ": the server did not return valid JSON."
            );
        }

        if (!data || data.success !== true) {
            throw new Error(
                stepName + ": the server returned an unsuccessful response."
            );
        }

        return data;
    }


    // Shows an error card on the page (instead of a popup)
    function showAnalysisError(message) {

        if (!resultsSection || !resultsContainer) {
            alert(message);
            return;
        }

        resultsContainer.innerHTML = `
            <div class="workspace-card border-danger p-4 text-center">
                <h4 class="text-danger fw-bold mb-3">⚠️ Analysis Encountered an Error</h4>
                <p class="text-secondary mb-3">${escapeHTML(message)}</p>
                <div class="alert alert-warning text-start mx-auto mt-3" style="max-width: 600px;">
                    <strong>Quick checks:</strong>
                    <ul class="mb-0 mt-2">
                        <li>Backend running: <code>uvicorn backend.main:app --reload</code> (from the ResumeAI folder)</li>
                        <li>Resume is a PDF or DOCX with selectable text</li>
                        <li><code>.env</code> has a valid <code>LLM_API_KEY</code> and <code>LLM_MODEL</code></li>
                    </ul>
                </div>
            </div>
        `;

        resultsSection.classList.remove("d-none");

        setTimeout(
            function () {
                resultsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            },
            100
        );
    }


    // MAIN FUNCTION - called when the user clicks "Analyze with AI"
    async function analyzeResumeAI() {

        // Ignore double clicks while an analysis is already running
        if (analysisInProgress) {
            return;
        }

        console.log("ResumeAI ANALYSIS STARTED");

        // ---------- 1. Check the inputs ----------

        if (
            !selectedResumeFile &&
            resumeFile &&
            resumeFile.files.length > 0
        ) {
            selectedResumeFile = resumeFile.files[0];
        }

        if (!selectedResumeFile) {
            alert("Please upload your resume first.");
            return;
        }

        const jdText = jobDescription
            ? jobDescription.value.trim()
            : "";

        if (!jdText) {
            alert("Please enter the job description first.");
            return;
        }

        if (jdText.length > 30000) {
            alert("The job description is too long (limit: 30,000 characters).");
            return;
        }

        console.log("Resume:", selectedResumeFile.name);
        console.log("JD characters:", jdText.length);

        // ---------- 2. Prepare the screen ----------

        analysisInProgress = true;

        // Clear results from any previous run
        resumeAnalysis = null;
        jdAnalysis = null;
        matchResult = null;
        tailoringResult = null;
        generatedResume = null;

        if (analyzeButton) {
            analyzeButton.disabled = true;
            analyzeButton.innerHTML = "✦ Analyzing...";
        }

        if (processingState) {
            processingState.classList.remove("d-none");
        }

        if (resultsSection) {
            resultsSection.classList.add("d-none");
        }

        // ---------- 3. Run the four steps ----------

        try {

            // STEP 1 - analyze the resume (file upload)
            setProgress(
                "ResumeAI is analyzing resume...",
                "Extracting resume information using AI..."
            );

            const resumeForm = new FormData();
            resumeForm.append("resume", selectedResumeFile);

            const resumeReply = await callBackend(
                "Resume analysis",
                "/api/resume/analyze",
                { method: "POST", body: resumeForm }
            );

            resumeAnalysis = resumeReply.analysis;

            if (!resumeAnalysis) {
                throw new Error("Resume analysis returned no data.");
            }

            console.log("STEP 1 done: resume analyzed", resumeAnalysis);


            // STEP 2 - analyze the job description (JSON)
            setProgress(
                "ResumeAI is analyzing Job Description...",
                "Extracting job requirements and skills..."
            );

            const jdReply = await callBackend(
                "JD analysis",
                "/api/jd/analyze",
                jsonRequest({ job_description: jdText })
            );

            jdAnalysis = jdReply.analysis;

            if (!jdAnalysis) {
                throw new Error("JD analysis returned no data.");
            }

            console.log("STEP 2 done: job description analyzed", jdAnalysis);


            // STEP 3 - match resume with job description
            setProgress(
                "ResumeAI is matching resume with job...",
                "Calculating skill compatibility and gaps..."
            );

            const matchReply = await callBackend(
                "Resume matching",
                "/api/match",
                jsonRequest({
                    resume_data: resumeAnalysis,
                    jd_data: jdAnalysis
                })
            );

            matchResult = matchReply.match_result;

            if (!matchResult) {
                throw new Error("Resume matching returned no data.");
            }

            console.log("STEP 3 done: matched", matchResult);


            // STEP 4 - tailoring suggestions
            setProgress(
                "ResumeAI is creating tailoring suggestions...",
                "Aligning your existing resume with the target job..."
            );

            const tailorReply = await callBackend(
                "Resume tailoring",
                "/api/tailor",
                jsonRequest({
                    resume_data: resumeAnalysis,
                    jd_data: jdAnalysis,
                    match_result: matchResult
                })
            );

            tailoringResult = tailorReply.tailoring;

            console.log("STEP 4 done: tailoring suggestions ready", tailoringResult);


            // ---------- 4. Show the results ----------

            displayAnalysisResults();

            console.log("ResumeAI ANALYSIS COMPLETED");

        } catch (error) {

            console.error("ResumeAI ERROR:", error);

            showAnalysisError(
                (error && error.message) ||
                "ResumeAI could not complete the analysis."
            );

        } finally {

            analysisInProgress = false;

            if (processingState) {
                processingState.classList.add("d-none");
            }

            if (analyzeButton) {
                analyzeButton.disabled = false;
                analyzeButton.innerHTML = "<span>✦</span> Analyze with AI";
            }
        }
    }


    // ========================================================
    // DISPLAY ANALYSIS RESULTS
    // ========================================================

    function displayAnalysisResults() {

        if (
            !resultsSection ||
            !resultsContainer
        ) {

            console.error(
                "Results section/container not found."
            );

            return;

        }


        const resume =
            resumeAnalysis || {};

        const jd =
            jdAnalysis || {};

        const match =
            matchResult || {};

        const tailor =
            tailoringResult || {};


        const candidateName =
            resume.candidate_name ||
            "Not available";


        const professionalTitle =
            resume.professional_title ||
            "Not available";


        const summary =
            resume.summary ||
            "Not available";


        const skills =
            Array.isArray(resume.skills)
                ? resume.skills
                : [];


        const jobTitle =
            jd.job_title ||
            "Not available";


        const company =
            jd.company ||
            "Not available";


        const requiredSkills =
            Array.isArray(jd.required_skills)
                ? jd.required_skills
                : [];


        const matchedSkills =
            Array.isArray(match.matched_skills)
                ? match.matched_skills
                : [];


        const missingSkills =
            Array.isArray(match.missing_skills)
                ? match.missing_skills
                : [];


        const score =
            match.match_score !== undefined
                ? match.match_score
                : (
                    match.skill_match_score !== undefined
                        ? match.skill_match_score
                        : 0
                );


        const matchingExperience =
            Array.isArray(match.matching_experience)
                ? match.matching_experience
                : [];


        const matchingProjects =
            Array.isArray(match.matching_projects)
                ? match.matching_projects
                : [];


        const recommendations =
            Array.isArray(match.recommendations)
                ? match.recommendations
                : [];


        const summarySuggestions =
            Array.isArray(
                tailor.summary_suggestions
            )
                ? tailor.summary_suggestions
                : [];


        const skillPriorities =
            Array.isArray(
                tailor.skill_priorities
            )
                ? tailor.skill_priorities
                : [];


        const overallRecommendations =
            Array.isArray(
                tailor.overall_recommendations
            )
                ? tailor.overall_recommendations
                : [];


        resultsContainer.innerHTML = `

            <div class="workspace-card mb-4">

                <div class="d-flex justify-content-between align-items-center mb-3">

                    <div>

                        <h3 class="mb-1">
                            Compatibility Score
                        </h3>

                        <p class="text-muted mb-0">
                            Resume and job description compatibility
                        </p>

                    </div>

                    <div>

                        <span class="score-badge">
                            ${escapeHTML(score)}%
                        </span>

                    </div>

                </div>


                <hr>


                <div class="row g-3">

                    <div class="col-md-6">

                        <h5 class="fw-bold text-success">
                            ✓ Matched Skills
                            (${matchedSkills.length})
                        </h5>

                        ${
                            matchedSkills.length > 0

                                ? matchedSkills
                                    .map(
                                        s =>
                                            `<span class="skill-pill matched">
                                                ✓ ${escapeHTML(s)}
                                            </span>`
                                    )
                                    .join("")

                                : "<span class='text-muted'>No exact matches found.</span>"
                        }

                    </div>


                    <div class="col-md-6">

                        <h5 class="fw-bold text-danger">
                            ✗ Missing Requirements
                            (${missingSkills.length})
                        </h5>

                        ${
                            missingSkills.length > 0

                                ? missingSkills
                                    .map(
                                        s =>
                                            `<span class="skill-pill missing">
                                                ✗ ${escapeHTML(s)}
                                            </span>`
                                    )
                                    .join("")

                                : "<span class='text-muted'>No missing key requirements.</span>"
                        }

                    </div>

                </div>

            </div>


            <div class="row g-4 mb-4">

                <div class="col-md-6">

                    <div class="workspace-card">

                        <h4>
                            📄 Resume Profile
                        </h4>

                        <p>
                            <strong>Candidate:</strong>
                            ${escapeHTML(candidateName)}
                        </p>

                        <p>
                            <strong>Title:</strong>
                            ${escapeHTML(professionalTitle)}
                        </p>

                        <p>
                            <strong>Summary:</strong>
                            ${escapeHTML(summary)}
                        </p>

                        <p>
                            <strong>Skills:</strong>
                            ${
                                skills.length > 0
                                    ? escapeHTML(
                                        skills.join(", ")
                                    )
                                    : "Not available"
                            }
                        </p>

                    </div>

                </div>


                <div class="col-md-6">

                    <div class="workspace-card">

                        <h4>
                            💼 Target Job Profile
                        </h4>

                        <p>
                            <strong>Job Title:</strong>
                            ${escapeHTML(jobTitle)}
                        </p>

                        <p>
                            <strong>Company:</strong>
                            ${escapeHTML(company)}
                        </p>

                        <p>
                            <strong>Required Skills:</strong>
                            ${
                                requiredSkills.length > 0
                                    ? escapeHTML(
                                        requiredSkills.join(", ")
                                    )
                                    : "Not available"
                            }
                        </p>

                    </div>

                </div>

            </div>


            <div class="workspace-card mb-4">

                <h4>
                    🔍 AI Matching Insights
                </h4>


                ${
                    matchingExperience.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Relevant Experience:
                                </strong>

                                <ul>
                                    ${
                                        matchingExperience
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    matchingProjects.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Relevant Projects:
                                </strong>

                                <ul>
                                    ${
                                        matchingProjects
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    recommendations.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Recommendations:
                                </strong>

                                <ul>
                                    ${
                                        recommendations
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }

            </div>


            <div class="workspace-card mb-4">

                <h4>
                    ✨ AI Tailoring Suggestions
                </h4>

                <p class="text-muted">
                    ResumeAI only uses truthful candidate information.
                </p>


                ${
                    summarySuggestions.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Summary Alignment:
                                </strong>

                                <ul>
                                    ${
                                        summarySuggestions
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    skillPriorities.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Prioritized Skills:
                                </strong>

                                <ul>
                                    ${
                                        skillPriorities
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    overallRecommendations.length > 0

                        ? `
                            <div class="mb-3">

                                <strong>
                                    Strategic Recommendations:
                                </strong>

                                <ul>
                                    ${
                                        overallRecommendations
                                            .map(
                                                item =>
                                                    `<li>
                                                        ${escapeHTML(item)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }

            </div>


            <div class="workspace-card text-center p-4">

                <h3>
                    Ready to Generate Your Tailored Resume?
                </h3>

                <p class="text-muted">
                    Generate a truthful optimized resume
                    in PDF and DOCX format.
                </p>


                <button
                    id="generateResumeBtn"
                    class="action-button"
                    type="button"
                >
                    ✦ Generate & Download Tailored Resume
                </button>

            </div>


            <div
                id="generatedResumeContainer"
                class="mt-4"
            ></div>

        `;


        resultsSection.classList.remove(
            "d-none"
        );


        // ====================================================
        // GENERATE BUTTON
        // ====================================================

        const genBtn =
            document.getElementById(
                "generateResumeBtn"
            );


        if (genBtn) {

            genBtn.type = "button";

            genBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    generateTailoredResumeAI();

                }
            );

        }


        // ====================================================
        // SCROLL TO RESULTS
        // ====================================================

        setTimeout(
            function () {

                resultsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            200
        );

    }


    // ========================================================
    // GENERATE TAILORED RESUME
    // ========================================================

    async function generateTailoredResumeAI() {

        const genBtn =
            document.getElementById(
                "generateResumeBtn"
            );


        if (genBtn) {

            genBtn.disabled = true;

            genBtn.innerHTML =
                "✦ Generating...";

        }


        if (processingState) {

            processingState.classList.remove(
                "d-none"
            );

        }


        try {

            console.log(
                "STEP 5 → /api/generate"
            );


            const response =
                await fetch(
                    `${API_BASE_URL}/api/generate`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            resume_data:
                                resumeAnalysis,

                            jd_data:
                                jdAnalysis,

                            match_result:
                                matchResult,

                            tailoring_result:
                                tailoringResult

                        })
                    }
                );


            console.log(
                "Generate API status:",
                response.status
            );


            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    `Resume generation failed (${response.status}): ${formatApiError(errorText)}`
                );

            }


            const result =
                await response.json();


            console.log(
                "Generate API response:",
                result
            );


            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    "Resume generation was unsuccessful."
                );

            }


            generatedResume =
                result.tailored_resume;


            // ==================================================
            // IMPORTANT
            // Your backend currently returns:
            //
            // files.pdf
            // files.docx
            //
            // NOT download_urls
            // ==================================================

            const files =
                result.files || {};


            const pdfPath =
                files.pdf || "";


            const docxPath =
                files.docx || "";


            let pdfUrl = "";
            let docxUrl = "";


            if (pdfPath) {

                pdfUrl =
                    pdfPath.startsWith("http")
                        ? pdfPath
                        : `${API_BASE_URL}${convertDownloadPath(pdfPath)}`;

            }


            if (docxPath) {

                docxUrl =
                    docxPath.startsWith("http")
                        ? docxPath
                        : `${API_BASE_URL}${convertDownloadPath(docxPath)}`;

            }


            displayGeneratedResumePreview(
                generatedResume,
                pdfUrl,
                docxUrl
            );


        } catch (error) {

            console.error(
                "Resume Generation ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to generate tailored resume."
            );


        } finally {

            if (processingState) {

                processingState.classList.add(
                    "d-none"
                );

            }


            if (genBtn) {

                genBtn.disabled = false;

                genBtn.innerHTML =
                    "✓ Tailored Resume Generated";

            }

        }

    }


    // ========================================================
    // CONVERT BACKEND FILE PATH
    // ========================================================

    function convertDownloadPath(filePath) {

        let path =
            String(filePath)
                .replace(/\\/g, "/");


        const filename =
            path.split("/").pop();


        if (
            filename.toLowerCase().endsWith(".pdf")
        ) {

            return `/api/download/pdf/${encodeURIComponent(filename)}`;

        }


        if (
            filename.toLowerCase().endsWith(".docx")
        ) {

            return `/api/download/docx/${encodeURIComponent(filename)}`;

        }


        return path.startsWith("/")
            ? path
            : `/${path}`;

    }


    // ========================================================
    // DISPLAY GENERATED RESUME
    // ========================================================

    function displayGeneratedResumePreview(
        resume,
        pdfUrl,
        docxUrl
    ) {

        const container =
            document.getElementById(
                "generatedResumeContainer"
            );


        if (!container) {
            return;
        }


        resume =
            resume || {};


        const candidateName =
            resume.candidate_name ||
            "Tailored Resume";


        const professionalTitle =
            resume.professional_title ||
            "";


        const summary =
            resume.summary ||
            "";


        const skills =
            Array.isArray(resume.skills)
                ? resume.skills
                : [];


        const experience =
            Array.isArray(resume.experience)
                ? resume.experience
                : [];


        const experienceSummary =
            itemToText(resume.experience_summary);


        const projects =
            Array.isArray(resume.projects)
                ? resume.projects
                : [];


        const education =
            Array.isArray(resume.education)
                ? resume.education
                : [];


        const certifications =
            Array.isArray(resume.certifications)
                ? resume.certifications
                : [];


        container.innerHTML = `

            <div class="workspace-card border-success">

                <div class="text-center mb-4">

                    <span class="ai-badge bg-success text-white mb-2">
                        ✓ GENERATION COMPLETE
                    </span>

                    <h2>
                        ${escapeHTML(candidateName)}
                    </h2>

                    ${
                        professionalTitle
                            ? `
                                <h5 class="text-muted">
                                    ${escapeHTML(professionalTitle)}
                                </h5>
                            `
                            : ""
                    }

                </div>


                <div class="d-flex justify-content-center gap-3 mb-4">

                    ${
                        pdfUrl

                            ? `
                                <a
                                    href="${pdfUrl}"
                                    class="download-btn download-btn-pdf"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    ↓ Download PDF
                                </a>
                            `

                            : ""
                    }


                    ${
                        docxUrl

                            ? `
                                <a
                                    href="${docxUrl}"
                                    class="download-btn download-btn-docx"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    ↓ Download DOCX
                                </a>
                            `

                            : ""
                    }

                </div>


                <hr>


                ${
                    summary

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Professional Summary
                                </h5>

                                <p>
                                    ${escapeHTML(summary)}
                                </p>

                            </div>
                        `

                        : ""
                }


                ${
                    skills.length > 0

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Skills
                                </h5>

                                <p>
                                    ${
                                        skills
                                            .map(
                                                s =>
                                                    `<span class="skill-pill">
                                                        ${escapeHTML(s)}
                                                    </span>`
                                            )
                                            .join("")
                                    }
                                </p>

                            </div>
                        `

                        : ""
                }


                ${
                    experience.length > 0

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Experience
                                </h5>

                                <ul>
                                    ${
                                        experience
                                            .map(
                                                e =>
                                                    `<li>
                                                        ${escapeHTML(e)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    experienceSummary

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Experience Summary (0-2 years level)
                                </h5>

                                <p>
                                    ${escapeHTML(experienceSummary)}
                                </p>

                                <small class="text-muted">
                                    Based only on your real projects and training. Please review and edit before use.
                                </small>

                            </div>
                        `

                        : ""
                }


                ${
                    projects.length > 0

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Projects
                                </h5>

                                <ul>
                                    ${
                                        projects
                                            .map(
                                                p =>
                                                    `<li>
                                                        ${escapeHTML(p)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    education.length > 0

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Education
                                </h5>

                                <ul>
                                    ${
                                        education
                                            .map(
                                                e =>
                                                    `<li>
                                                        ${escapeHTML(e)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }


                ${
                    certifications.length > 0

                        ? `
                            <div class="mb-3">

                                <h5>
                                    Certifications
                                </h5>

                                <ul>
                                    ${
                                        certifications
                                            .map(
                                                c =>
                                                    `<li>
                                                        ${escapeHTML(c)}
                                                    </li>`
                                            )
                                            .join("")
                                    }
                                </ul>

                            </div>
                        `

                        : ""
                }

            </div>

        `;


        setTimeout(
            function () {

                container.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            200
        );

    }


    // ========================================================
    // HTML ESCAPE
    // ========================================================

    // The AI may return an item as an object, for example
    // {degree: "B.Tech", institution: "XYZ", year: "2025"}.
    // This turns any item into readable text: "B.Tech | XYZ | 2025".
    function itemToText(value) {

        if (value === null || value === undefined) {
            return "";
        }

        if (Array.isArray(value)) {
            return value
                .map(itemToText)
                .filter(Boolean)
                .join(", ");
        }

        if (typeof value === "object") {
            return Object.values(value)
                .map(itemToText)
                .filter(Boolean)
                .join(" | ");
        }

        return String(value);
    }


    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return itemToText(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ========================================================
    // FINAL DEBUG
    // ========================================================

    console.log(
        "ResumeAI frontend initialized successfully."
    );

}