# StoryForge

**AI-powered animated story platform — built with a production-grade DevSecOps pipeline**

[![CI — Security, Lint & Build](https://github.com/Cyb3rMoose/storyforge/actions/workflows/ci.yml/badge.svg)](https://github.com/Cyb3rMoose/storyforge/actions/workflows/ci.yml)
[![Deploy — S3 + CloudFront](https://github.com/Cyb3rMoose/storyforge/actions/workflows/deploy.yml/badge.svg)](https://github.com/Cyb3rMoose/storyforge/actions/workflows/deploy.yml)
[![Terraform Validate](https://github.com/Cyb3rMoose/storyforge/actions/workflows/terraform.yml/badge.svg)](https://github.com/Cyb3rMoose/storyforge/actions/workflows/terraform.yml)
[![Security: Gitleaks](https://img.shields.io/badge/security-gitleaks-blue)](https://github.com/gitleaks/gitleaks)
[![IaC: Checkov](https://img.shields.io/badge/IaC%20scan-checkov-brightgreen)](https://www.checkov.io/)

StoryForge lets users record or type a story prompt, which is then transformed into a short animated video using a chain of AI services: **Claude** for scriptwriting, **Runway ML** for motion video generation with native audio, and **FFmpeg** for final assembly. The result is delivered via a private AWS S3 bucket with presigned URLs enforcing Zero Trust access.

This repository demonstrates a **Secure SDLC** applied to a real, production AI application — embedding security tooling at every stage of the CI/CD pipeline, with Infrastructure as Code managed through Terraform.

> **Live demo:** [https://d2wsxozpwngfxe.cloudfront.net](https://d2wsxozpwngfxe.cloudfront.net)

---

## Architecture

```mermaid
flowchart TD
    User([User / Browser])
    CF[CloudFront CDN\nHTTPS only]
    S3F[S3 — Frontend\nPrivate + OAC]
    API[Node.js Backend API\nLambda-compatible handlers]
    Claude[Anthropic Claude\nStory scriptwriter]
    Whisper[OpenAI Whisper\nAudio transcription]
    Runway[Runway ML veo3.1_fast\nMotion video + native audio]
    FFmpeg[FFmpeg\nVideo assembly]
    S3M[S3 — Media Bucket\nAES-256 encrypted\nPrivate + presigned URLs]

    User -->|HTTPS| CF
    CF -->|OAC sigv4| S3F
    User -->|HTTPS POST| API
    API -->|Prompt| Claude
    API -->|Base64 audio| Whisper
    API -->|Scene prompts| Runway
    Runway -->|Video clips| S3M
    API --> FFmpeg
    FFmpeg -->|final.mp4| S3M
    S3M -->|Presigned URL 1h TTL| User

    style S3M fill:#2d6a4f,color:#fff
    style CF fill:#1d3557,color:#fff
    style API fill:#457b9d,color:#fff
```

---

## DevSecOps Pipeline

Security is enforced at every stage. The build will **not proceed** unless all security gates pass.

```mermaid
flowchart LR
    Push([git push]) --> Gitleaks
    Push --> Audit
    Push --> SAST
    Push --> DAST
    Push --> Trivy
    Push --> IaC

    Gitleaks["🔑 Secret Scanning\nGitleaks\nFull git history scan"]
    Audit["📦 Dependency Audit\nnpm audit\nFrontend + Backend\nBlocks on HIGH+"]
    SAST["🔍 SAST\nSemgrep\nJS · Node · React · Secrets"]
    DAST["🌐 DAST\nOWASP ZAP Baseline\nLive API scan"]
    Trivy["🛡️ SCA\nTrivy Filesystem\nCVE + misconfig scan"]
    IaC["🏗️ IaC Security\nCheckov on Terraform\nCIS Benchmark"]
    Lint["✅ Lint\nESLint"]

    Gitleaks --> Lint
    Audit --> Lint
    SAST --> Lint
    DAST --> Lint
    Trivy --> Lint
    IaC --> Lint

    Lint --> Build["🔨 Build\nVite production\nbundle"]
    Build --> Deploy["🚀 Deploy\nS3 sync\nCloudFront invalidation"]

    style Gitleaks fill:#e63946,color:#fff
    style Audit fill:#e63946,color:#fff
    style SAST fill:#e63946,color:#fff
    style DAST fill:#e63946,color:#fff
    style Trivy fill:#e63946,color:#fff
    style IaC fill:#e63946,color:#fff
    style Deploy fill:#2d6a4f,color:#fff
```

---

## Security Controls

| Layer | Control | Tool | Gate |
|---|---|---|---|
| **Secrets** | Hardcoded credential detection across full git history | Gitleaks | Blocks build |
| **Dependencies (Frontend)** | CVE audit on npm packages | npm audit | Blocks on HIGH+ |
| **Dependencies (Backend)** | CVE audit on backend npm packages | npm audit | Blocks on HIGH+ |
| **SAST** | Static analysis — JS, Node.js, React, secrets patterns | Semgrep | Blocks build |
| **DAST** | Baseline scan of live backend REST API | OWASP ZAP | Blocks on FAIL |
| **SCA / Filesystem** | CVE and misconfiguration scan of project files | Trivy | Blocks on HIGH+ |
| **IaC** | Terraform security policy enforcement (CIS Benchmark) | Checkov | Blocks on FAIL |
| **Code Quality** | ESLint — no unused vars, no unsafe refs | ESLint | Blocks build |
| **Transport** | HTTPS enforced at CloudFront — HTTP redirected | Terraform | Infrastructure |
| **Storage** | S3 buckets fully private — all public ACLs blocked | Terraform | Infrastructure |
| **Access** | Presigned URLs with 1-hour TTL for media delivery | AWS SDK | Runtime |
| **Encryption** | AES-256 server-side encryption on both S3 buckets | Terraform | Infrastructure |
| **IAM** | Least-privilege policies scoped per resource and action | Terraform | Infrastructure |
| **CDN** | CloudFront OAC (Origin Access Control) with SigV4 signing | Terraform | Infrastructure |

---

## AI Security

Integrating multiple AI providers introduces a distinct threat surface. See [docs/ai-security.md](docs/ai-security.md) for the full breakdown.

**Key controls applied:**

- **API key isolation** — Anthropic, OpenAI and Runway ML keys stored as GitHub Actions secrets and environment variables; never committed to source
- **Secret scanning** — Gitleaks scans full git history on every push to catch any accidental key exposure
- **Prompt injection mitigation** — user input is injected into a structured system prompt with explicit content instructions; raw user text is never executed as a top-level instruction
- **Input validation** — story prompts are length-capped and sanitised server-side before being forwarded to AI providers
- **Least-privilege AI calls** — each provider is called with the minimum required parameters; no admin or account-management API calls
- **Media access control** — AI-generated content stored in a private S3 bucket; served only via short-lived presigned URLs preventing public enumeration

---

## Threat Model

A full STRIDE threat model covering all components of the AI generation pipeline is documented in [docs/threat-model.md](docs/threat-model.md).

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | SPA framework and build tooling |
| Zustand | Global state management |
| Web Audio API | In-browser audio recording |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API (Lambda-compatible handlers) |
| Anthropic Claude (claude-haiku-4-5) | Story script generation |
| OpenAI Whisper (whisper-1) | Audio transcription |
| Runway ML (veo3.1_fast) | Motion video clips with native audio |
| FFmpeg (fluent-ffmpeg) | Video concatenation |
| AWS S3 | Media and frontend asset storage |
| AWS CloudFront | CDN with HTTPS enforcement |

### Infrastructure & Security
| Technology | Purpose |
|---|---|
| Terraform | Infrastructure as Code |
| GitHub Actions | CI/CD pipeline |
| Gitleaks | Secret scanning |
| Semgrep | SAST (JS/Node/React/secrets) |
| OWASP ZAP | DAST — live API scanning |
| Trivy | SCA — filesystem CVE scanning |
| Checkov | IaC security scanning |
| npm audit | Dependency vulnerability audit |

---

## Repository Structure

```
storyforge/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # Security gates + lint + build
│   │   ├── deploy.yml      # S3 + CloudFront deployment
│   │   └── terraform.yml   # IaC validate + Checkov scan
│   └── dependabot.yml      # Automated dependency updates
├── backend/
│   ├── functions/
│   │   ├── generateScript/     # Claude story scriptwriter
│   │   ├── generateVideoClips/ # Runway ML video generation
│   │   ├── renderVideo/        # FFmpeg assembly
│   │   └── transcribeAudio/    # OpenAI Whisper
│   └── local-server.js         # Express dev server
├── docs/
│   ├── ai-security.md      # AI provider threat surface + controls
│   └── threat-model.md     # STRIDE threat model
├── src/
│   ├── api/storyforge.js   # Frontend API client
│   ├── components/         # React components
│   └── store/              # Zustand state
├── terraform/
│   ├── cloudfront.tf       # CDN with HTTPS enforcement
│   ├── iam.tf              # Least-privilege IAM policies
│   ├── s3.tf               # Private buckets + encryption
│   └── main.tf
└── .env.example            # Required environment variables
```

---

## Local Development

### Prerequisites
- Node.js 20+
- An `.env` file at the repo root (see `.env.example`)

### Required environment variables

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
RUNWAYML_API_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-2
AWS_S3_BUCKET=storyforge-media
```

### Run

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start backend (port 3001)
npm run dev:backend

# Start frontend (port 5173)
npm run dev
```

---

## Infrastructure

All AWS infrastructure is managed via Terraform in the `terraform/` directory.

**Resources provisioned:**
- S3 media bucket — AES-256 encrypted, fully private, lifecycle policy (auto-delete after N days)
- S3 frontend bucket — AES-256 encrypted, versioned, CloudFront OAC access only
- CloudFront distribution — HTTPS enforcement, SPA routing, asset cache headers
- IAM policies — scoped least-privilege per resource (media bucket, CloudFront invalidation, frontend deploy)

The Terraform workflow runs Checkov IaC scanning before any AWS credentials are configured, ensuring security policy validation is never skipped.

---

## Security Reporting

See [SECURITY.md](SECURITY.md) for responsible disclosure policy.
