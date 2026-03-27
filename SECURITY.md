# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| main branch | ✅ Active |

## Reporting a Vulnerability

If you discover a security vulnerability in StoryForge, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to report

Email: mohsin_syed50@hotmail.com

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations (optional)

### What to expect

- Acknowledgement within 48 hours
- An assessment of severity and impact within 5 business days
- A fix or mitigation plan communicated before any public disclosure

## Scope

The following are in scope:

- The StoryForge backend REST API
- The React frontend application
- AWS infrastructure configuration (Terraform)
- CI/CD pipeline security controls
- AI provider integrations (prompt injection, credential exposure)

The following are **out of scope**:

- Vulnerabilities in third-party AI providers (Anthropic, OpenAI, Runway ML) — report these directly to the respective providers
- Social engineering attacks
- Physical attacks

## Security Controls

See [README.md](README.md#security-controls) for a full list of security controls implemented in this project, and [docs/threat-model.md](docs/threat-model.md) for the STRIDE threat model.
