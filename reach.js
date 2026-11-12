// ===== The title shrinks into the top bar =====
// Over the first stretch of scrolling each word of "Reach App for Climbers" shrinks in its own spot
// down to a small title, and the description rises with it to sit right under the title.
// Scrolling back up grows them back. The movement trails the scroll a little and eases in and out.
// (styles.css, "Project page")
const TITLE = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--size-title")); // size/title, from styles.css
const SMALL_TITLE = 24; // px: the small title's size, half again the menu's 16px, like in the reference
const STICK_END = 48; // px from the top where the description ends up, under the small title
const root = document.documentElement;
// Phones get a plain column (styles.css): no shrinking, sticking, cutting, sliding or fading there
const phone = matchMedia("(max-width: 700px)");
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (n) => Math.min(Math.max(n, 0), 1);

// The rest of the small text at the top isn't faded: it slides up and is cut off, as if going under
// the title (the tags, at the line the description sits on) or under the description (the course and collaboration)
const about = document.querySelector(".project__about");
const vanishing = document.querySelectorAll(".project__course, .project__collab, .project__tags");

// The research and graphic texts each stick a line under the text before them
const research = document.querySelector(".project__text--research");
function measureStacks() {
  const line = 16 * 1.15;
  const researchTop = STICK_END + about.offsetHeight + line;
  root.style.setProperty("--stick-research", `${researchTop}px`);
  root.style.setProperty("--stick-graphic", `${researchTop + research.offsetHeight + line}px`);
}

// "Graphic Language & Direction": each letter, spaces included, gets its own span.
// On a phone the title and the subtitle take the spacing of the phone frame (data-phone) and stay put.
// ponytail: decided once on load, so turning a tablet across 700px keeps the first layout until a reload
const subtitle = document.querySelector(".project__subtitle");
if (phone.matches) document.querySelectorAll("[data-phone]").forEach((line) => { line.textContent = line.dataset.phone; });
// HAVEN has no subtitle: then there are no letters to move
const subtitleLetters = phone.matches || !subtitle ? [] : [...subtitle.textContent].map((char) => {
  const letter = document.createElement("span");
  letter.textContent = char;
  return letter;
});
if (subtitleLetters.length) subtitle.replaceChildren(...subtitleLetters);
const visibleLetters = subtitleLetters.filter((letter) => letter.textContent.trim());

// Where each letter ends up: the same words with single spaces, closed up against the right edge.
// A hidden copy laid out like that tells how far each letter has to travel.
function measureSubtitle() {
  if (!visibleLetters.length) return;
  subtitleLetters.forEach((letter) => letter.style.setProperty("--go", 0));
  const packed = subtitle.cloneNode();
  packed.textContent = subtitle.textContent.trim().replace(/\s+/g, " ");
  packed.style.cssText = "visibility: hidden; left: auto; right: calc(15 * var(--x));";
  subtitle.after(packed);
  const range = document.createRange();
  let index = 0;
  [...packed.textContent].forEach((char, position) => {
    if (char === " ") return;
    range.setStart(packed.firstChild, position);
    range.setEnd(packed.firstChild, position + 1);
    const letter = visibleLetters[index++];
    letter.style.setProperty("--shift", `${range.getBoundingClientRect().left - letter.getBoundingClientRect().left}px`);
  });
  packed.remove();
}

let shown = 0; // the title's progress as drawn, trailing the scroll
let lastScroll = scrollY;
let goingUp = false;
let frame = null;

function update() {
  frame = null;
  const x = innerWidth / 1440; // 1px of the Figma frame
  const target = clamp(scrollY / (400 * x));
  shown += (target - shown) * 0.18;
  if (Math.abs(target - shown) < 0.001) shown = target;
  else frame = requestAnimationFrame(update);

  const progress = easeInOut(shown);
  const start = about.parentElement.offsetTop; // where the description sits in Figma (117px on Reach, 105 on Record Day)
  const stickTop = start + (STICK_END - start) * progress;
  root.style.setProperty("--title-scale", 1 + (SMALL_TITLE / (TITLE * x) - 1) * progress);
  root.style.setProperty("--stick-top", `${stickTop}px`);

  // Going down they're cut off at the line; coming back up they fade in instead, once they're
  // below the line again (the fade itself is a CSS transition on the site's ease)
  if (scrollY !== lastScroll) goingUp = scrollY < lastScroll; // frames without a scroll keep the last direction
  lastScroll = scrollY;
  vanishing.forEach((text) => {
    const line = text.parentElement === about.parentElement ? about.getBoundingClientRect().bottom : stickTop;
    const cut = phone.matches ? 0 : line - text.getBoundingClientRect().top;
    if (goingUp) {
      text.style.clipPath = "";
      text.classList.toggle("is-faded", cut > 0);
    } else {
      text.classList.remove("is-faded");
      text.style.clipPath = cut > 0 ? `inset(${cut}px 0 0 0)` : "";
    }
  });

  // The subtitle's letters go one after another as it rises through the screen, the rightmost first
  if (!visibleLetters.length) return;
  const rise = clamp((innerHeight * 0.9 - subtitle.getBoundingClientRect().top) / (innerHeight * 0.6));
  visibleLetters.forEach((letter, index) => {
    const wait = (visibleLetters.length - 1 - index) / (visibleLetters.length - 1) * 0.5;
    letter.style.setProperty("--go", easeInOut(clamp((rise - wait) / 0.5)));
  });
}

function requestUpdate() {
  if (!frame) frame = requestAnimationFrame(update);
}

root.style.setProperty("--stick-end", `${STICK_END}px`);
document.fonts.ready.then(() => {
  measureSubtitle();
  measureStacks();
  update();
});
measureStacks();
update();
addEventListener("scroll", requestUpdate, { passive: true });
addEventListener("resize", () => {
  measureSubtitle();
  measureStacks();
  requestUpdate();
});
