# Provenance, Retrieval Records, and Verification (`Rules R2, R15, R16, R17`)

Every regulatory document and map in Structured Building Bylaws must trace to a verifiable external origin. This document explains how sources enter the dataset, what is recorded at acquisition time, how CI blocks synthetic or unverified sources, and how anyone can verify a clause against its source PDF.

## 1. How a Source Enters the Dataset

1. **Discovery & Priority**: Candidate sources are searched across official authorities in priority order:
   1. Issuing authority or Karnataka e-Gazette
   2. India Code
   3. BBMP / GBA town planning pages and BPAS circulars
   4. OpenCity urban data portal
   5. Wayback Machine archives
   Every search query, visited URL, and outcome is logged in `data/reports/<jurisdiction>/source-discovery.md`.
2. **Acquisition (`bylaws acquire`)**:
   - Raw PDFs and KML/GeoJSON files are downloaded into `data/raw/<jurisdiction>/` (gitignored local cache; raw binaries are not committed to Git).
   - `bylaws acquire` follows HTTP redirects with polite retries and a descriptive `User-Agent`, computes the SHA-256 digest of the fetched bytes, and requests a **Wayback Machine (Save Page Now)** snapshot.
3. **Quoted Evidence (`Rule R17`)**:
   - Title, issuing authority, notification number, notified date, effective/commencement date, and `status_evidence.quoted_line` are quoted directly from the fetched document itself — never from a plan, news article, or memory.

## 2. The Retrieval Record (`RetrievalRecord`)

Every acquired source in `schemas/document.schema.json` and `schemas/jurisdiction.schema.json` carries a `retrieval` block:

```json
{
  "fetched_at": "2026-11-24T00:00:00Z",
  "requested_url": "https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf",
  "final_url": "https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf",
  "http_status": 200,
  "content_type": "application/pdf",
  "content_length": 1048576,
  "response_headers": {
    "etag": "\"abc123\"",
    "last_modified": "Mon, 23 Nov 2026 10:00:00 GMT",
    "server": "Apache",
    "date": "Tue, 24 Nov 2026 00:00:00 GMT"
  },
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "archive_url": "https://web.archive.org/web/20261124000000/https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf",
  "archive_failure_reason": null,
  "fetched_by": "agent"
}
```

Either `archive_url` or `archive_failure_reason` must be populated on every retrieval record.

## 3. The CI Provenance Gate (`bylaws check-provenance`)

Executed on every push and pull request in `.github/workflows/ci.yml`, `bylaws check-provenance` (`pipeline/bylaws/provenance.py`) fails the build if:

1. **Local or non-HTTP(S) `source_url`**: Any jurisdiction with `visibility != "test"` has a `file://`, relative, or local path in `source_url` on any document or map entry.
2. **Incomplete `retrieval` block**: Any acquired document (`acquisition_status: "acquired"`, `text_rights.mode != "reference_only"`) in a non-test jurisdiction lacks a complete `retrieval` block.
3. **Denylisted PDF Metadata (`Rule R16`)**: Any PDF in a non-test jurisdiction (or in `data/` / `public/data/`) has a PDF `Creator` or `Producer` matching the configurable denylist in `bylaws.toml` (`fpdf`, `pypdf`, `reportlab`, `structuredbuildingbylaws`).

## 4. Scheduled Source Verification (`bylaws verify-sources`)

To detect upstream link rot or silent file replacements without making every CI push depend on external government servers:

```bash
cd pipeline
uv run bylaws verify-sources --jurisdiction in-ka-bengaluru-south
```

- Refetches every acquired `http(s)` source for the jurisdiction and compares the live SHA-256 digest against the recorded `sha256`.
- Runs automatically every Monday at 04:00 UTC in `.github/workflows/verify-sources.yml` and opens a GitHub issue if any link is dead or any checksum mismatches.

## 5. How to Check Any Clause Against Its Source

1. On any Document or Map page in the web interface, every clause displays its 1-based source page number (`p. N`), verification status (`unverified`, `machine_checked`, or `human_verified`), and a **"View source p. N"** link.
2. Clicking **"View source p. N"** opens the official PDF URL at `#page=N` (with the Wayback Machine archive link available alongside on the Sources page).
3. To verify file integrity locally, compare the downloaded PDF's `sha256sum` against the `sha256` recorded in `sources.json` / `documents.json` and `SHA256SUMS`.
