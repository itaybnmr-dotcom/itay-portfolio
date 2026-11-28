# Gaps: Figma vs. the site

Where the live site and the Figma file ("Itay Ben Mayor Portfolio") differed in a way that mattered, and what was decided for each:

- **Fixed in code:** the site was brought back to Figma.
- **Update in Figma:** the site is right, and Figma should follow it.
- **Works:** the gap stays on purpose, usually because the site does something a static frame can't show.

The rule behind every decision: Figma wins, unless the thing depends on code (motion, hover, scroll, a browser limit).

Sources: the measured audit of 9.11.2026 (desktop at 1440×1024, phone at 402×874) and the site's commit history. Gaps of 1–3px are left out.

---

## Fixed in code

| # | Where | Figma | Site | When |
|---|-------|-------|------|------|
| 1 | Home | Everything under the top bar starts at y 177 | Everything sat about 60px higher | The footer moved 105px higher to match (19.11). The home page was later rebuilt from the "Home screen experiments" frame (26.11) |
| 2 | WIP | Log rows 52px apart, intro 14px | Rows 24px apart, intro 16px | WIP rebuilt from the "WIP" frame, rows 52px apart (26.11) |
| 3 | Phones, all pages | New phone frames: 18px bar, "Instagram" spelled out, numbered works, 18px tags and footer | Older phone layout | Rebuilt from the frames (20.11 and 26.11) |
| 4 | Reach, phone | Collaboration line on the course line; one line indented | Own line, no indent | Rebuilt from the new phone frame (20.11) |
| 5 | Israel Museum, phone | No "Visit the site" in the frame | Shown | Removed on phones (20.11) |
| 6 | Project pages | Description at y 145, clear of the title | Description too close to the big and the small title | Placed like Figma (16.11) |
| 7 | Reach | Intro line breaks before "personalized" | Broke elsewhere | Intro box set to Figma's 404px (9.11) |

## Update in Figma

| # | Where | Figma | Site | Why the site is right |
|---|-------|-------|------|-----------------------|
| 1 | Top bar, every page | "Multidisciplinary Designer based in TLV" in the middle | Removed (28.11) | Decided after the design was done; the frames still show it |
| 2 | WIP in the menu | Phone frames have "/ WIP"; the desktop project frames don't | Computers have WIP, phones don't (28.11) | WIP is built for a computer screen (sideways rows, drawers) |
| 3 | Home, "More to come soon" | The After Effects film (703:2) | The globe and the running strip | The film read as a project of its own (26.11) |
| 4 | Poster Archive | The two handmade posters 478 wide, running 15px past the right edge and overlapping | 448 wide, inside the 15px margin, 10px apart | The frame breaks the page's own margin (20.11) |
| 5 | Record Day, phone frame | "Indesgin" | "Indesign" | Typo in the frame |
| 6 | Home, card labels | Record Day's labels at 14px Bold, the other three at 16px Bold | One size on all four (at the time) | Figma isn't consistent with itself |

## Works: different on purpose

These depend on code, so a static frame can't show them. The frame shows the resting state.

| # | Where | What the site does |
|---|-------|--------------------|
| 1 | Every link | The hover line draws from one side to the other |
| 2 | Cursor | A circle. It turns into its negative over text and grows over links. On the home cards it writes the work's name around itself; on posters it becomes a black rectangle with the poster's details |
| 3 | Project pages | While scrolling, the big title shrinks into a small one. The description rides up under it, and the small texts are cut off at the same line and fade back in on the way up |
| 4 | Project pages | Titles and texts fade out while a picture passes under them |
| 5 | Openings | Words rise in one by one on every page (home, About, project pages). Page changes fade and rise in 0.15s and 0.3s |
| 6 | WIP | The headline's letters move sideways, fall when clicked and can be thrown. Meetings open as drawers with rows that scroll sideways |
| 7 | Home | A live corner with the place, time and weather |

## Changed because of a browser limit

| # | Where | Figma | Site | Why |
|---|-------|-------|------|-----|
| 1 | Reach, logo board | Vector with a noise filter | The same board as a WebP image with the noise baked in | The SVG noise filter crashed iPhone Safari |
| 2 | Cursor's ring, phones | — | Not drawn on phones | Measuring text in a hidden circle crashed iPhone Safari on a tap |
| 3 | Videos, phones | — | Lighter copies, loaded only as they come near | Heavy videos stalled on phones. On computers they play at full quality |
| 4 | Pictures | — | WebP, and 3× exports of text-heavy pages (the WIP interview) | Loading weight, and sharp text on Retina screens |

---

Earlier version: the full measured audit of 9.11, position by position, is in this file's git history (commit 5388503).
