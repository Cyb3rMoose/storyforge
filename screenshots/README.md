# Screenshots — LinkedIn Post Guide

This folder stores screenshots for the StoryForge DevSecOps portfolio post.
Below is a prioritised list of exactly what to capture, why each one is valuable, and how to get the best result.

---

## Screenshot Priority List

### 1. GitHub Actions CI — All Jobs Green ⭐ MOST IMPORTANT
**File:** `01_ci_pipeline_green.png`
**Where:** `github.com/Cyb3rMoose/storyforge/actions` → click the latest passing CI run

**What to show:**
- The full job list with all 7 jobs green: Secret Scanning, Dependency Audit, SAST, DAST, Trivy, Lint, Build
- Expand the sidebar so all job names are readable
- The green tick on each job must be clearly visible

**Why it matters:** This is the most important screenshot. It proves the pipeline actually runs and passes — not just that you wrote the config file.

---

### 2. GitHub Actions CI — Security Jobs Expanded
**File:** `02_ci_sast_semgrep.png`
**Where:** Inside the passing CI run → click "SAST (Semgrep)" job → expand the "Run Semgrep" step

**What to show:**
- The Semgrep output showing which rulesets ran (p/javascript, p/nodejs, p/react, p/secrets)
- Ideally showing "✓ 0 findings" or a clean pass

**Why it matters:** Shows depth — you ran 4 different rule packs, not just a checkbox scan.

---

### 3. Trivy SARIF — GitHub Security Tab
**File:** `03_github_security_tab.png`
**Where:** `github.com/Cyb3rMoose/storyforge/security/code-scanning`

**What to show:**
- The Security → Code scanning tab showing Trivy results uploaded
- Even if it shows findings, that's fine — it proves the integration works

**Why it matters:** The Security tab is a GitHub Advanced Security feature. Showing it signals you understand vulnerability management tooling, not just running scans.

---

### 4. ZAP Report Artifact
**File:** `04_zap_report.png`
**Where:** CI run → "DAST (OWASP ZAP Baseline)" job → scroll to bottom, click "Artifacts" → download `zap-report` → open `report_html.html` in browser

**What to show:**
- The ZAP HTML report header showing the target URL and scan date
- The alerts table showing any findings with their risk level

**Why it matters:** ZAP is listed on your CV as a skill. This is the only screenshot that proves you've actually run it against a real API.

---

### 5. The App Working — Story Being Generated
**File:** `05_app_generating.png`
**Where:** Live demo at `https://d2wsxozpwngfxe.cloudfront.net`

**What to show:**
- The generating modal open mid-pipeline with a step active (e.g. "Generating video clips with sound…")
- The progress bar partially filled
- The step indicators showing which stage is running

**Why it matters:** Proves this is a real, working production application — not a lab exercise.

---

### 6. The App Working — Finished Video Playing
**File:** `06_app_video_playing.png`
**Where:** Live demo → generate a short story → editor screen with video playing

**What to show:**
- The animation editor with a generated video playing
- The video player showing a frame of the generated content
- The scrubber showing progress through the video

**Why it matters:** End-to-end proof the AI pipeline works. Hiring managers will find this memorable.

---

### 7. OWASP Assessment Document
**File:** `07_owasp_assessment.png`
**Where:** `github.com/Cyb3rMoose/storyforge/blob/main/docs/owasp-assessment.md`

**What to show:**
- The rendered markdown on GitHub showing the OWASP table with findings and ✅ Remediated statuses
- Scroll to show the "Remediation Summary" table at the bottom with all 10 rows ticked

**Why it matters:** Demonstrates structured security thinking — you didn't just fix bugs, you assessed against a recognised framework and documented it.

---

### 8. Terraform IaC + Checkov Pass
**File:** `08_terraform_checkov.png`
**Where:** `github.com/Cyb3rMoose/storyforge/actions` → latest "Terraform Validate" run → expand "Checkov IaC Scan" step

**What to show:**
- Checkov output showing checks passed and which ones were skipped (with justification)
- The `Passed checks: X` line clearly visible

**Why it matters:** IaC security is a core DevSecOps skill. Checkov pass with justified skip list shows maturity.

---

### 9. Dependabot PRs Open
**File:** `09_dependabot_prs.png`
**Where:** `github.com/Cyb3rMoose/storyforge/pulls` — after Dependabot has run (allow 24–48hrs after push)

**What to show:**
- One or more Dependabot PRs open showing automated dependency updates
- The "dependabot" label visible

**Why it matters:** Shows automated SDLC hygiene — the pipeline maintains itself.

---

### 10. README on GitHub
**File:** `10_readme_rendered.png`
**Where:** `github.com/Cyb3rMoose/storyforge`

**What to show:**
- The README rendered with the Mermaid architecture diagram visible
- The CI/deploy/security badges showing green at the top
- Enough of the security controls table to show it exists

**Why it matters:** First thing any hiring manager or recruiter sees when they click your GitHub link.

---

## LinkedIn Post Draft

Use this as a starting point — personalise it with your own voice:

---

> 🔐 I recently completed a DevSecOps pipeline for a production AI animation platform — and I wanted to share what I built and what I learned.
>
> **StoryForge** uses Anthropic Claude, OpenAI Whisper and Runway ML to turn spoken story prompts into short animated videos. I treated the security of this platform as seriously as I would a client engagement.
>
> **What I implemented:**
>
> 🔍 7-stage CI security gate — Gitleaks (secret scanning), npm audit (SCA), Semgrep SAST, OWASP ZAP DAST, Trivy filesystem scan, Checkov IaC scanning, ESLint — builds blocked on Critical/High findings
>
> 🤖 AI-specific security controls — prompt injection mitigations, API key isolation across 3 providers, SSRF protection on AI output URLs, LLM output length capping before downstream use
>
> 🏗️ Zero Trust AWS infrastructure — private S3 buckets with AES-256 encryption, presigned URL media delivery, least-privilege IAM, CloudFront OAC with SigV4 signing
>
> 📋 OWASP assessment — applied both the OWASP LLM Top 10 and API Security Top 10, identified 10 findings (3 Critical, 5 Medium), and remediated all 10 with documented evidence
>
> 🛡️ STRIDE threat model — 30+ individual threats assessed across the full AI generation pipeline
>
> The thing that surprised me most was how much the AI integration changed the threat surface. Prompt injection, API key exposure across 3 paid services, and model abuse are risks you don't think about in a traditional web app — but they're very real when your backend is making £-per-request AI calls.
>
> Everything is open source — link in comments.
>
> #DevSecOps #CloudSecurity #AWS #OWASP #CyberSecurity #AIEngineering #GitHub #Terraform #ShiftLeft

---

## Tips for the post

- Post in the **morning** (8–9am Tuesday–Thursday) for maximum reach
- Add the screenshots as a **carousel** (LinkedIn allows up to 10 images) — use them in the order listed above
- Pin a comment with the GitHub repo link immediately after posting
- Tag relevant skills: DevSecOps, AWS, OWASP, Terraform, GitHub Actions
- The video of the app generating a story is your most scroll-stopping visual — use screenshot 6 as your **cover image**
