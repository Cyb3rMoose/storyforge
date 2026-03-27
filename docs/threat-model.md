# Threat Model — StoryForge

**Methodology:** STRIDE
**Version:** 1.0
**Date:** March 2026
**Scope:** AI animation generation pipeline and AWS infrastructure

---

## System Overview

StoryForge is a web application that transforms user story prompts into short animated videos via a chain of AI services. The system consists of:

- A React SPA served via AWS CloudFront
- A Node.js backend API (Express, Lambda-compatible)
- Three external AI providers (Anthropic, OpenAI, Runway ML)
- AWS S3 for media and frontend asset storage

### Data Flow

```
User Browser
  │
  ├─[HTTPS]──► CloudFront ──► S3 (frontend SPA)
  │
  └─[HTTPS POST]──► Backend API (Node.js)
                        │
                        ├──► Anthropic Claude API  (story script)
                        ├──► OpenAI Whisper API    (audio → text)
                        ├──► Runway ML API         (text → video clips)
                        │
                        ├──► S3 Media Bucket       (store clips + final video)
                        └──► FFmpeg                (concatenate clips)
                                │
                                └──► S3 Media Bucket (final.mp4)
                                          │
                                          └─[Presigned URL]──► User Browser
```

---

## STRIDE Analysis

### Component 1 — Browser ↔ Backend API

#### S — Spoofing
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| S1 | Attacker impersonates a legitimate user to submit generation requests | No authentication currently — all requests are anonymous by design (MVP scope) | Open — auth out of scope for MVP |
| S2 | Attacker forges Origin header to bypass CORS | CORS is permissive (`*`) on the local dev server; in production the API is not publicly exposed without a domain | Accepted risk for MVP |

#### T — Tampering
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| T1 | Man-in-the-middle modification of story prompt in transit | HTTPS enforced via CloudFront (`redirect-to-https`); backend API should be placed behind HTTPS (API Gateway/ALB) in production | Partially mitigated |
| T2 | Attacker modifies request body to inject malicious scene parameters | Backend validates `jobId` and `clips` presence; structured JSON schema limits accepted fields | Mitigated |

#### R — Repudiation
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| R1 | User denies submitting a harmful generation request | No audit log of prompts or job requests currently exists | Open — audit logging recommended |

#### I — Information Disclosure
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| I1 | Error responses leak internal stack traces or file paths | Express catches errors and returns generic messages (`Internal server error`); stack traces logged server-side only | Mitigated |
| I2 | API responses reveal AI provider details or internal structure | Responses are shaped by backend before returning to client — raw AI provider responses are not forwarded | Mitigated |

#### D — Denial of Service
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| D1 | Attacker floods `/api/generate` with requests, exhausting AI API credits | No application-layer rate limiting currently applied | Open — `express-rate-limit` recommended |
| D2 | Oversized audio upload (base64) causes memory exhaustion | Express body limit set to 50MB; audio recordings are short by design | Mitigated |

#### E — Elevation of Privilege
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| E1 | No privilege escalation possible — API has no user roles or admin endpoints | N/A | N/A |

---

### Component 2 — Backend API ↔ AI Providers

#### S — Spoofing
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| S3 | Attacker intercepts and replaces AI provider API responses | HTTPS to all AI providers (Anthropic, OpenAI, Runway ML SDK enforces TLS) | Mitigated |
| S4 | AI provider SDK connects to a spoofed endpoint | Provider SDKs use hardcoded base URLs with TLS certificate validation | Mitigated |

#### T — Tampering
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| T3 | Prompt injection — user input manipulates Claude system instructions | User input wrapped in structured system prompt; Claude output parsed as strict JSON schema | Partially mitigated |
| T4 | Malicious content in Claude output is passed raw to Runway ML | Claude output parsed as structured JSON; only `sceneDescription` field passed to Runway | Mitigated |

#### R — Repudiation
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| R2 | AI provider denies processing a request (billing dispute) | Job IDs logged server-side; Runway task IDs logged | Partially mitigated |

#### I — Information Disclosure
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| I3 | AI provider API keys exposed via logs or environment variable dump | Keys in environment variables only; Gitleaks scans git history; Semgrep scans for secret patterns | Mitigated |
| I4 | Story prompt content sent to AI provider without user awareness | No PII is collected; story prompts are user-authored fictional content | Accepted |

#### D — Denial of Service
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| D3 | AI provider rate limit hit causes pipeline failure | Each provider's rate limits apply; errors surface to user via pipeline error response | Accepted |

#### E — Elevation of Privilege
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| E2 | Stolen API key grants attacker full account access to AI provider | Keys are generation-only; no account management or billing API calls are made | Mitigated |

---

### Component 3 — Backend API ↔ AWS S3

#### S — Spoofing
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| S5 | Attacker impersonates the backend to write to S3 | AWS SDK uses IAM credentials (access key + secret); least-privilege IAM policy scoped to `jobs/*` prefix only | Mitigated |

#### T — Tampering
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| T5 | Attacker overwrites S3 objects to replace generated videos | IAM policy allows PutObject only on `jobs/*` prefix; no public write access | Mitigated |
| T6 | Attacker modifies video in transit between S3 and user | Presigned URLs use HTTPS; S3 Transfer Acceleration not used (not needed at current scale) | Mitigated |

#### R — Repudiation
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| R3 | Malicious content upload cannot be attributed | S3 server access logging not currently enabled | Open — S3 access logging recommended |

#### I — Information Disclosure
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| I5 | Generated videos accessible to anyone with the S3 URL | Media bucket is fully private; all public access blocked at bucket policy level | Mitigated |
| I6 | Presigned URL shared or intercepted beyond intended recipient | URLs have 1-hour TTL; acceptable trade-off for media delivery use case | Accepted |
| I7 | S3 bucket name enumerable, enabling discovery attacks | Bucket is private — enumeration returns 403 without valid credentials | Mitigated |

#### D — Denial of Service
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| D4 | Storage exhaustion from uncleaned job files | Lifecycle policy auto-deletes `jobs/` prefix objects after configured retention period | Mitigated |

#### E — Elevation of Privilege
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| E3 | Stolen AWS credentials grant access beyond intended scope | IAM policy scoped to media bucket `jobs/*` prefix only; CloudFront invalidation scoped to single distribution | Mitigated |
| E4 | IAM policy allows privilege escalation (e.g. attaching new policies) | No IAM management actions granted; no `iam:*` permissions in any policy | Mitigated |

---

### Component 4 — CloudFront ↔ S3 Frontend

#### S — Spoofing
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| S6 | Attacker bypasses CloudFront to access S3 frontend directly | CloudFront OAC (Origin Access Control) with SigV4 signing; bucket policy allows only CloudFront service principal | Mitigated |

#### T — Tampering
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| T7 | Attacker injects malicious content into the SPA | S3 bucket is read-only for CloudFront; write access scoped to CI/CD IAM policy only | Mitigated |

#### I — Information Disclosure
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| I8 | Frontend S3 bucket directly accessible exposing asset structure | Bucket policy restricts access to CloudFront OAC only; direct S3 URL returns 403 | Mitigated |

#### D — Denial of Service
| ID | Threat | Mitigation | Status |
|---|---|---|---|
| D5 | DDoS against CloudFront distribution | CloudFront has built-in AWS Shield Standard protection; rate limiting can be added via AWS WAF | Partially mitigated |

---

## Risk Summary

| ID | Threat | Likelihood | Impact | Overall | Status |
|---|---|---|---|---|---|
| D1 | API rate abuse / cost exhaustion | High | High | **Critical** | Open |
| T3 | Prompt injection via user input | Medium | High | **High** | Partially mitigated |
| S1 | Unauthenticated API access | High | Medium | **High** | Accepted (MVP) |
| R1 | No audit log of generation requests | Medium | Medium | **Medium** | Open |
| R3 | No S3 access logging | Low | Medium | **Medium** | Open |
| T1 | API not behind HTTPS in production | Medium | High | **High** | Open (backend deployment) |
| I6 | Presigned URL shared beyond intended recipient | Low | Low | **Low** | Accepted |

---

## Recommended Remediations

| Priority | Recommendation | Addresses |
|---|---|---|
| 1 | Add `express-rate-limit` to `/api/generate` (e.g. 5 req/min per IP) | D1 |
| 2 | Deploy backend behind AWS API Gateway or ALB with HTTPS | T1, S1 |
| 3 | Implement structured audit logging (job ID, timestamp, prompt length) | R1 |
| 4 | Enable S3 server access logging on the media bucket | R3 |
| 5 | Conduct adversarial prompt injection testing against Claude integration | T3 |
| 6 | Enable AWS WAF on CloudFront distribution with rate-based rules | D5 |
