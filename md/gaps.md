# Gaps: Figma vs. the site

Checked on 9.11.2026 against the Figma file "Itay Ben Mayor Portfolio" (`zravRK9lDdBlU89ivMeEYq`).
Desktop = the site at 1440×1024, compared to the 1440 frames. Phone = the site at 402×874, compared to the 402 "phone - …" frames.
Positions are `x,y` in px from the top-left of the page. A difference of 1–3px is left out.

Not checked: hovers, animations, the cursor, and anything below where a Figma frame ends.

---

## Desktop

### Home (`index.html` ↔ "Home screen")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Everything under the top bar sits higher | hero text box at y 177, cards at y 902, bio at y 1869, footer line at y 2281 | hero at y 117, cards at y 842, bio at y 1809, footer line at y 2222 (≈60px higher; page 2264 tall vs 2308) |
| 2 | Card labels ("No. 1 … Reach", "Landing Page & App", tags): size and weight | 16px **Bold** (Record Day's labels: 14px Bold) | 14px **Medium** on all four cards |
| 3 | "Currently in my final year of Visual Communication at Bezalel Academy of Arts & Design" | not in the desktop frame | shown at 609,525 |
| 4 | HAVEN card video | 29,1348 | 29,1292 (part of #1) |

### Reach (`reach.html` ↔ "עמוד פריט ריץ׳")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Third paragraph of the first text: "Our goal was to make Reach feel like a personal trainer who understands and feels the users." | shown on desktop | phone only, hidden on desktop (`project__phone-only`) |
| 2 | Nav | "About / Contact / IG" (no WIP) | "About / Contact / IG / WIP" |

Media, titles and the other texts match.

### Israel Museum Index (`israel-museum.html` ↔ "עמוד פריט אינדקס מוזיאון ישראל")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Showreel | 60,245 · 1318×809 | 37,245 · 1364×837 |
| 2 | Two videos under it (artwork page / index list) | y 1073 · 649×395, at x 60 and 729 | y 1101 · 673×410 at x 37, 671×409 at x 730 |
| 3 | "collections-hover" video | 729,1484 · 648×395 | 730,1531 · 671×409 |
| 4 | Research text ("The original museum's site…") | y 1484 | y 1531 (+47) |
| 5 | "Layout as Curation" text ("The works are the main object…") | y 2040 | y 2098 (+58) |
| 6 | Screenshot grid (6 images) | rows at y 2260 / 2747 / 3226 | rows at y 2318 / 2805 / 3284 (+58) |
| 7 | Bio and footer | bio y 3729, page 4190 tall | bio y 3787, page 4242 tall (+58) |
| 8 | Nav | "About / Contact / IG" | "… / WIP" |

The site's media are on the 37px edge from the latest commits. Figma still has the 60px edge.

### Record Day (`record-day.html` ↔ "עמוד פריט יום התקליט")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Nav | "About / Contact / IG" | "… / WIP" |

Texts, media and positions match.

### WIP (`wip.html` ↔ "WIP")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Intro ("A portfolio in progress…") | 14px, at 604,78, 332 wide | 16px, at 602,78, 345 wide |
| 2 | Space between log rows | ≈51px (rows at y 220 / 272 / 323) | 24px (rows at y 220 / 244 / 268) |
| 3 | Third log row | "Made a style guide page · 9.11 · 2026" | "From identity to a system · 2.11 · 2026" |
| 4 | "Of this portfolio" | 14px | 16px |

---

## Phone

### Home (`index.html` ↔ "phone - home screen")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | "Currently in my final year…" | y 436 | y 396 (40 higher) |
| 2 | Reach card media | site video 23,649 · 269×169; phone 301,649 · 82×169 | 21,603 · 262×164; 298,602 · 81×167 (46 higher, a little smaller) |
| 3 | Reach card labels: size | 14px | 11.58px |
| 4 | Reach card labels: position | y 916 | y 853 |
| 5 | Reach card tags: text | "ux/ui · Product · Interactive · Branding · 2026" | "ux-ui / Product / Interactive / Branding" |
| 6 | "No. 1 … Reach" label above the card | not in the frame | shown at y 495 |
| 7 | Cards 2–4 (Israel Museum, Record Day, HAVEN) | not in the frame (it shows the Reach card only) | shown, so the footer lands at y 2190 instead of 1869 |

### Reach (`reach.html` ↔ "phone - Reach")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Collaboration line | on the course line: "…Ofir Gurevich, In collaboration with: Or Sinalevich" | on its own line, no comma |
| 2 | "Each route becomes a shareable abstraction." | indented (6 spaces) | not indented |

Media and other positions match.

### Israel Museum Index (`israel-museum.html` ↔ "phone - israel museum index")

No gaps found. Texts, media and positions match.

### Record Day (`record-day.html` ↔ "phone - Record Day")

| # | What | Figma | Site |
|---|------|-------|------|
| 1 | Tags | "…After Effects, Indesgin" (typo) | "…After Effects, Indesign" |

Media and positions match.

### WIP (`wip.html`)

There's no phone frame for WIP in Figma, so I couldn't compare it.

---

## Across pages

- **WIP in the nav:** the desktop project frames (Reach, Israel Museum, Record Day) have "About / Contact / IG". The site has "/ WIP" on every page, and Figma has it too on Home, WIP and all the phone frames.
- **Figma's own mismatches:** Record Day's card labels on Home are 14px Bold while the other three are 16px Bold. "Indesgin" is misspelled in the phone Record Day frame.
