# Security Policy

## Supported Versions

Security updates are applied to the latest release on `main` and the active published dataset release (`4.0.0`).

| Version | Supported |
|---------|-----------|
| `4.0.x` (`main`) | Yes |
| `< 4.0` | No |

## Reporting a Vulnerability

If you discover a security issue in the **Bylaw One** web application, build scripts, or Python pipeline:

1. **Preferred**: Open a private report via [GitHub Security Advisories](https://github.com/manideepmamidala2-bit/bylaws-india/security/advisories/new).
2. **Email**: Contact the maintainers at the address configured in `bylaws.toml` under `[contact].email` (currently placeholder `contact@example.org`).

Please do **not** open a public GitHub issue for unpatched security vulnerabilities. We aim to acknowledge reports within 5 business days and publish a fix or mitigation before public disclosure.

## Privacy & Data Posture

Bylaw One is a static, read-only public reference:
- The website requires no user accounts, logins, or cookies.
- Workshop verification responses on `/verify/<task-set>` are stored solely in the user's browser (`localStorage`) and exported locally as a `.csv` file; nothing is transmitted to a server.
- Analytics use cookieless Vercel Web Analytics with no personal data collection.
