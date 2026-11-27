---
id: see-it-working
number: "02"
title: "See it working"
kicker: "02 / Live Walkthrough"
audiences: [college, student, practitioner, partner-funder]
diagrams: [how-a-rule-travels]
screenshots: [far-story, subject-far, map-place-card, verify-task]
---

## Slide summary

Four live views show Bylaw One working today: the five-step FAR story (2004 to today), a subject page showing what applies today first, the map Place Card with rules by zone, and a browser workshop verification task.

## Presenter notes

Let's look at four parts of the live site that work today. First, on the home page, the five-step FAR story traces Floor Area Ratio from the 2004 municipal bye-laws (Bye-law 9.2, Table 6) to the 2007 Master Plan Zoning Regulations (Chapter 4, Table 10), the 2017 Bye-law 1.4 hand-off notification, the April 2025 Premium FAR Chapter 11 amendment, and how base FAR, Premium FAR, and TDR combine today. Second, every subject page opens with "What applies today" — deduplicated parameter tables and consolidated provisions — with older or replaced rules collapsed below. Third, the interactive map lets you search a neighbourhood like Jayanagar and open the Place Card showing governing rules for that zone across six groups. Fourth, the Verify page lets workshop participants compare a record side by side with the official PDF page and export a CSV verdict.

## Reading version

Four live workflows show how the pilot works in practice today:

1. **The FAR story (`/`):** Traces Floor Area Ratio across twenty-two years in five steps — **2004** (*Building Bye-laws 2003*, Bye-law 9.2: `"The set backs required on all the sides of building/s, maximum plot coverage, maximum FAR, maximum number of floors, maximum height of buildings that are permissible for different dimensioned sites and widths of roads are set out in Tables 4, 5 and 6 given below."`, p. 21), **2007** (*Revised Master Plan 2015 Zoning Regulations*, Chapter 4, Table 10, p. 28), **2017** (Bye-law 1.4 inserted by Notification UDD 14 TTP 2017, p. 2, handing use, coverage, FAR, setbacks, height, storeys, dwelling units, and parking to the Master Plan), **2025** (Premium FAR Chapter 11, Table 27, p. 2), and **Today** (how Base FAR, Premium FAR, and TDR combine under Note 2, p. 3).
2. **A subject page (`/j/in-ka-bengaluru/topics/far`):** Opens with **What applies today** ({{rules_as_data}} active parameter rows across subjects, with plain-word conditions, normal units `m`, `m²`, `%`, and `p. N` PDF links), followed by **Why this rule applies** (with quoted statutory authority on tap) and collapsed **Older or replaced rules**.
3. **The map Place Card (`/j/in-ka-bengaluru`):** Search any neighbourhood or ward (`MiniSearch` over `2,174` indexed places and `{{wards}}` wards) to open the **Place Card** showing the Corporation, Ward, Planning district, Land-use zone, and **Rules for this zone** grouped into `Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, and `Parking`.
4. **A verification task (`/verify/bengaluru-pilot-sample`):** Shows the structured record on one side and an **Open official page** link on the other so students and practitioners can record `Match`, `Mismatch`, or `Can't tell` verdicts in the browser and export a `.csv` file.
