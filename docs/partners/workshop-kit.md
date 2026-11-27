# Bylaw One — One-Day College Workshop Kit

**Format**: Full-day studio workshop (5 sessions · ~6 hours total) · **Audience**: Undergraduate or postgraduate students of Architecture, Urban Planning, Civil Engineering, or Law (20–60 students)

---

## 1. Five-Session Schedule

### Session 1 (09:30 – 10:30) — Why Building Rules Are Hard
- **Goal**: Understand why answering *"What can I build on this plot?"* requires reading multiple overlapping legal instruments rather than a single PDF.
- **Activity**:
  - Divide students into groups and hand each group one raw PDF (Building Bye-laws 2003, RMP 2015 Zoning Regulations, 2017 Notification UDD 14 TTP 2017, April 2025 Premium FAR notification, or May 2026 City Corporation amendment).
  - Ask every group to find the maximum Floor Area Ratio (FAR) and setbacks for a `600 m²` residential plot on a `15 m` road.
  - Compare the different numbers each group finds (`1.00`, `2.25`, `+30%` premium FAR) and discuss why dates, layers, and repealing/routing clauses matter.

### Session 2 (10:45 – 12:00) — Follow One Rule Across Twenty-Two Years
- **Goal**: Trace a single rule chronologically and learn the six-step statutory resolution order.
- **Activity**:
  - Walk through the 5-step FAR story on the Bylaw One home page (`/`):
    1. **2004**: Building Bye-laws 2003 Table 6 (`p. 23`).
    2. **2007**: Master Plan Zoning Regulations Chapter 4 Table 10 (`p. 28`).
    3. **2017**: Bye-law 1.4 (`Notification UDD 14 TTP 2017, p. 2`) handing zoning parameters to the Master Plan.
    4. **2025**: Premium FAR Chapter 11 (`Table 27, p. 2`).
    5. **Today**: How base FAR, premium FAR, and TDR combine on `/j/in-ka-bengaluru/topics/far`.
  - Inspect `/j/in-ka-bengaluru-south` on the interactive map, search for a neighbourhood, open the **Place Card**, and inspect the 6 rule groups (`Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`).

### Session 3 (13:00 – 14:45) — Verify for Real (Using Part 4)
- **Goal**: Verify structured provisions and parameter rows against official government PDF pages and produce real verification records.
- **Activity**:
  - Each student opens their assigned task set at `/verify/<task-set>` (generated before the workshop via `bylaws tasks create --jurisdiction in-ka-bengaluru --count 15 --subject <subject> --seed <n>`).
  - Students enter their full name and college name.
  - For each task, two students independently open the official PDF page link (`#page=N`), compare the gazette text or table cell against the text or value shown on Bylaw One, mark **Match**, **Mismatch**, or **Can't tell**, and add a note if anything differs.
  - Students click **Export completed CSV** and submit their `.csv` file to the workshop facilitator.
  - The facilitator runs `bylaws verify import <csv> --jurisdiction in-ka-bengaluru` live to show how records with two independent `Match` verdicts become `"Verified by a person"` and how any `Mismatch` opens a review item in `verification-review.md`.

### Session 4 (15:00 – 16:00) — Using AI with Citations (and Catching Hallucinations)
- **Goal**: Learn how to use AI assistants responsibly on legal and regulatory questions.
- **Activity**:
  - Open `/use-with-ai`, `/llms.txt`, and a subject Markdown page (`/j/in-ka-bengaluru/topics/setbacks.md`).
  - Compare asking an ungrounded LLM *"What are the setbacks for a 10 m high house in Bengaluru?"* vs. giving the LLM `/j/in-ka-bengaluru/topics/setbacks.md` and enforcing the four honesty rules:
    1. Cite the exact page (`p. N`).
    2. Label derived values.
    3. Ask for missing plot details (depth, width, road width, zone) instead of guessing.
    4. Confirm with the authority.

### Session 5 (16:00 – 17:00) — Show and Tell
- **Goal**: Present findings, review any mismatches discovered in Session 3, and credit participants.
- **Activity**:
  - Each group presents one interesting rule interaction, edge case, or extraction issue they found during Session 3.
  - File any confirmed issues using the **Report a problem** link on the site.
  - Review the updated verifier credits list for the next dataset release.

---

## 2. Materials Checklist

- **Before the workshop**:
  - Generate task sets for each subject table (`far`, `setbacks`, `ground-coverage`, `height`, `parking`, `land-use`):
    ```bash
    cd pipeline
    uv run bylaws tasks create --jurisdiction in-ka-bengaluru --count 15 --subject far --seed 101 --task-set-id workshop-far-101
    ```
  - Print copies of the generated `.html` task sheets (`workshop-far-101.html`) as a paper backup in case Wi-Fi is slow.
- **In the room**:
  - Projector for the live walkthrough.
  - Student laptops or tablets with browser access to `https://bylaws-india.vercel.app`.
  - Shared folder or email dropbox to collect exported `.csv` files at the end of Session 3.

---

## 3. Facilitator Notes

- **Assign every task set to at least two students independently**: Under Bylaw One's verification rules, a record only becomes `"Verified by a person"` (`human_verified`) when at least two independent verifiers record `Match` and zero verifiers record `Mismatch`.
- **Celebrate `Mismatch` findings**: Make clear to students that finding a `Mismatch` (a OCR typo, a wrong unit, a missed footnote, or a wrong page citation) is the highest-value outcome of the workshop.
- **Never guess when the scan is blurry**: If a scanned gazette table is illegible, mark **Can't tell** and note the page and column in the note field.

---

## 4. Certificate Template Text

```text
CERTIFICATE OF VERIFICATION & PARTICIPATION

This certifies that

    [Student Full Name]
    [Department / College Name]

participated in the Bylaw One Statutory Reading & Open Data Verification Workshop
held on [Date] in [City], and verified municipal building bye-law and master plan
zoning records against official government Gazette publications for the
Bylaw One Open Dataset (licensed under CC BY 4.0).

Verified contributions are permanently credited in the Bylaw One release archive.

Signed:

_______________________________          _______________________________
[Faculty Coordinator Name]               [Bylaw One Lead]
[College / Institution]                  [Owner's Organisation]
```
