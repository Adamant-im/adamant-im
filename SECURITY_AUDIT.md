# Security Audit — ADAMANT Messenger

## Status
Audit in progress. Critical and High findings reported to maintainers
via responsible disclosure on [date]. Full report to be published
after remediation period (90 days).

## Methodology
- STRIDE threat modeling
- Manual code review
- SAST: Semgrep (p/javascript, p/typescript, p/vue, p/owasp-top-ten)
- SCA: Semgrep Supply Chain
- Dynamic testing of production endpoints

## Summary (non-technical)
Identified 6 Critical, 4 High, 3 Medium, 3 Low findings across
cryptographic implementation, XSS surface, network layer,
and supply chain dependencies.

Full technical report will be published following responsible
disclosure period.