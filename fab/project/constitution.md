# bylaws-india Constitution

## Core Principles

### I. Regulatory Accuracy & Citation Traceability
Every bylaw rule, threshold, formula, or compliance check surfaced by the platform MUST trace back to an explicit source citation (jurisdiction, document/gazette edition, chapter, clause/table number, and effective date). The system SHALL NOT fabricate or silently interpolate regulatory values when a rule is ambiguous or jurisdiction-dependent; missing or unverified provisions MUST be surfaced explicitly to the user.

### II. Jurisdiction & Amendment Isolation
Indian building and municipal bylaws vary across states, development authorities, plot categories, road widths, and amendment dates. Data models and rule evaluators MUST treat jurisdiction, zoning/use category, and effective version as first-class parameters rather than global constants. Cross-jurisdiction logic SHOULD share structural schemas while keeping authority-specific rules cleanly isolated and data-driven.

### III. Type Safety & Deterministic Computation
Core bylaw calculations (FAR/FSI, setbacks, ground coverage, height limits, parking norms, and fee computations) MUST be implemented as pure, deterministic, strictly typed functions separated from UI and network layers. All units of measure (e.g., meters vs. feet, sq.m vs. sq.ft) SHALL be normalized or explicitly tagged at boundaries to prevent unit-conversion defects.

### IV. Spec-First Incremental Delivery
Changes MUST follow the spec-first workflow (`intake` -> `apply` -> `review` -> `hydrate` -> `ship`), keeping `docs/memory/` and `docs/specs/` synchronized with the implementation. Features SHOULD be delivered in small, verifiable slices with clear acceptance criteria rather than unreviewed monolithic changes.

### V. Accessible, Transparent User Experience
The web interface SHOULD present complex legal and technical regulations with progressive disclosure—showing clear summary verdicts alongside the underlying formula inputs, step-by-step calculations, and verbatim clause text so architects, engineers, and homeowners can independently verify results.

## Additional Constraints

### Test Integrity
Tests MUST conform to the implementation spec — never the other way around. When tests fail, the fix SHALL either (a) update the tests to match the spec, or (b) update the implementation to match the spec. Modifying implementation code solely to accommodate test fixtures or test infrastructure is prohibited. Specs are the source of truth; tests verify conformance to specs.

## Governance

**Version**: 1.0.0 | **Ratified**: 2026-11-23 | **Last Amended**: 2026-11-23
