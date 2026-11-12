// ===== The top bar follows the scroll =====
// Once the works reach the middle of the screen the name rolls into "Works" and keeps its line
// until the very end of the page, where "Contact" gets the line instead (styles.css, .is-active)
const topName = document.querySelector(".top-bar__name");
const contactLink = document.querySelector('.top-bar__links a[href="#contact"]');
const reached = (selector) => document.querySelector(selector).getBoundingClientRect().top < innerHeight / 2;

// Phones get no scroll effects: the bar just stays as it is there
const phoneLayout = matchMedia("(max-width: 700px)");

function markSection() {
  if (phoneLayout.matches) {
    topName.classList.remove("is-active");
    contactLink.classList.remove("is-active");
    return;
  }
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 1;
  topName.classList.toggle("is-active", reached(".work") && !atBottom);
  contactLink.classList.toggle("is-active", atBottom);
}
markSection();
addEventListener("scroll", markSection, { passive: true });
addEventListener("resize", markSection);

// ===== Intro =====
// Black, then "Hi,", a pause, "I'm", and the name word by word;
// then the rest of the headline all at once; then everything else writes itself in.
// Each word rises in from just below its own spot (styles.css, "Intro").
// The headline is always split into words, so the intro only has to switch the animation on.
const statement = document.querySelector(".hero__statement");
statement.setAttribute("aria-label", statement.textContent.replace(/\s+/g, " ").trim());
const START = 600; // ms of black first
// When each of "Hi, I'm Itay Ben Mayor," comes in, in ms:
// "Hi,", a pause, "I'm", then the name right after it (ignoring the gap between them), one word after another
const BEATS = [0, 800, 950, 1100, 1250];
let wordCount = 0;

statement.querySelectorAll(".hero__line > span").forEach((part) => {
  const firstLine = part.parentElement === statement.firstElementChild;
  const words = part.textContent.split(/( +)/);
  part.textContent = "";
  words.forEach((word) => {
    if (!word.trim()) return part.append(word); // the spaces stay plain text
    const delay = firstLine ? START + BEATS[wordCount++] : null;
    const mask = document.createElement("span");
    mask.className = "intro__word";
    mask.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.setProperty("--d", delay === null ? "var(--rest)" : `${delay}ms`);
    mask.append(inner);
    part.append(mask);
  });
});
statement.classList.add("is-split");

// Phones: the drawn headline's words take the same moments, in order ("Hi," "I'm" "Itay" "Ben" "Mayor,"
// on their beats, the rest with the rest of the headline)
document.querySelectorAll(".hero__phone-statement path").forEach((word, index) => {
  word.style.setProperty("--d", index < BEATS.length ? `${START + BEATS[index]}ms` : "var(--rest)");
});


// The note under the headline types itself in like code: one character after another,
// each one flashing as a block first (styles.css, .intro__key). It starts with everything else.
const TYPE_GAP = 25; // ms between characters
let typed = 0;
function typeOut(element) {
  [...element.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return typeOut(node);
    const letters = [...node.textContent].map((char) => {
      const letter = document.createElement("span");
      letter.className = "intro__key";
      letter.textContent = char;
      letter.style.setProperty("--k", typed++);
      return letter;
    });
    node.replaceWith(...letters);
  });
}
if (document.documentElement.classList.contains("intro")) typeOut(document.querySelector(".hero__note"));

if (document.documentElement.classList.contains("intro")) {
  const restStart = START + BEATS[BEATS.length - 1] + 900;
  document.documentElement.style.setProperty("--rest", `${restStart}ms`);
  document.documentElement.style.setProperty("--type-gap", `${TYPE_GAP}ms`);
  document.fonts.ready.then(() => {
    document.documentElement.classList.add("intro-go");
    // After the last thing has written itself in, the page goes back to normal
    // Then "Works ↓" writes itself in (styles.css, .hero__works), 1200ms
    const last = Math.max(3 * 150 + 1200, typed * TYPE_GAP + 150);
    document.documentElement.style.setProperty("--last", `${last}ms`);
    setTimeout(() => document.documentElement.classList.remove("intro", "intro-go"), restStart + 900 + last + 1200);
  });
}

// ===== The cards' stickers (touch screens) =====
// Each one pops in once its card's top has been scrolled up past 60% of the screen (so the first
// doesn't pop in under the headline right away), then its letters write themselves in one after
// another (styles.css, .work__sticker; script.js splits the letters)
if (matchMedia("(hover: none)").matches) document.querySelectorAll(".work__sticker").forEach((sticker) => {
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    sticker.classList.add("is-in");
    observer.disconnect();
  }, { rootMargin: "0px 0px -40% 0px" }).observe(sticker.parentElement);
});

// ===== The open card's works run left (computers) =====
// While a row is open its works slide left without end (styles.css, .work__card): what's in the card is
// copied once after itself and the card moves by one copy, at the same speed on any screen.
// Reach's card is one drawn set; the others are their frame's pieces
// ponytail: decided once on load; a window resized across 700px keeps what it started with
const STRIP_SPEED = 45; // px per second on Figma's 1440px-wide frame
if (!phoneLayout.matches) document.querySelectorAll(".work__card, .work__frame").forEach((strip) => {
  [...strip.children].forEach((piece) => {
    const copy = piece.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    strip.append(copy);
  });
  strip.style.setProperty("--strip-time", `${strip.offsetWidth / 2 / (STRIP_SPEED * innerWidth / 1440)}s`);
});

// ===== Opening a work (computers with a mouse) =====
// A first click opens the row into its big card (styles.css, .is-open). Then the work itself turns the
// cursor into "More info" and a click on it goes to the case study, while a click on its row closes it.
// Esc or a click outside closes it too.
if (!phoneLayout.matches && matchMedia("(hover: hover)").matches) {
  const works = document.querySelectorAll(".work");
  works.forEach((work) => work.removeAttribute("data-cursor"));
  document.querySelector(".works").style.setProperty("--count", works.length); // styles.css: the open row's height
  const open = (work, event) => {
    works.forEach((other) => {
      other.classList.toggle("is-open", other === work);
      // Only the open work's card takes the "More info" circle (script.js, data-cursor), not its row
      // (Reach's card is drawn from Figma; the others still show their frame)
      const card = other.querySelector(".work__card") ?? other.querySelector(".work__frame");
      if (other === work) card.dataset.cursor = "More info";
      else card.removeAttribute("data-cursor");
    });
    // script.js: the cursor changes right away for whatever is under it, without waiting for the mouse to move
    if (event) showWord(document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-cursor]") ?? null);
    // Opening brings the list up to fill the screen under the top bar
    if (work) document.querySelector(".works").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  works.forEach((work) => work.addEventListener("click", (event) => {
    const isOpen = work.classList.contains("is-open");
    if (isOpen && !event.target.closest(".work__row")) return; // the open work: the link goes to the case study
    event.preventDefault();
    open(isOpen ? null : work, event);
  }));
  addEventListener("keydown", (event) => { if (event.key === "Escape") open(null); });
  // A click anywhere outside the works closes the open one
  document.addEventListener("click", (event) => { if (!event.target.closest(".work")) open(null, event); });
}
