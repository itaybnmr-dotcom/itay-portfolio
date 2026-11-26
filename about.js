// ===== About page =====
// People who turned off animations in their system settings see everything standing still
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Opening, like the home page's =====
// Black, then the whole text at once; then the globe and the top of the footer write themselves in (the top bar is already there). Each word rises in from just below
// its own spot, with the home page's styles (styles.css, "Intro"). about.html adds .intro.
// "And most importantly I am..." waits until the opening is over.
const INTRO_START = 600;                 // ms of black first, like the home page
const text = document.querySelector(".about-story__text");
text.setAttribute("aria-label", text.textContent);
function splitWords(element) {
  [...element.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return splitWords(node); // the bold words keep their <b>
    const parts = node.textContent.split(/( +)/).map((word) => {
      if (!word.trim()) return document.createTextNode(word); // the spaces stay plain text
      const mask = document.createElement("span");
      mask.className = "intro__word";
      mask.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.textContent = word;
      inner.style.setProperty("--d", "var(--rest)"); // every word together
      mask.append(inner);
      return mask;
    });
    node.replaceWith(...parts);
  });
}
splitWords(text);
text.classList.add("is-split");

// Phones: their own text (about.html), set line by line; each word rises with the rest, like the home page's
const phoneText = document.querySelector(".about-story__phone");
phoneText.querySelectorAll(".w").forEach((word) => {
  const inner = document.createElement("span");
  inner.append(...word.childNodes);
  inner.style.setProperty("--d", "var(--rest)");
  word.classList.add("intro__word");
  word.append(inner);
});
phoneText.classList.add("is-split");

const page = document.documentElement;
// about.html decides whether it plays (adding .intro); a page prepared in the background decides once
// it's shown, so this waits for that too (about.html's listener runs first, it was added first)
const shown = new Promise((ready) =>
  document.prerendering ? document.addEventListener("prerenderingchange", ready, { once: true }) : ready()
);
const introOver = shown.then(() => new Promise((done) => {
  if (!page.classList.contains("intro")) return done();
  const restStart = INTRO_START;
  page.style.setProperty("--rest", `${restStart}ms`);
  const go = () => {
    page.classList.add("intro-go");
    // The footer (the last to write in) is done 900ms + 3 × 150ms + 1200ms after the rest of the text starts
    setTimeout(() => {
      page.classList.remove("intro", "intro-go");
      done();
    }, restStart + 900 + 3 * 150 + 1200);
  };
  document.fonts.ready.then(go);
}));

// The globe turns in script.js (shared with the home page)

// ===== "And most importantly I am..." rises word by word, then "Open to work" takes its place =====
// Each word is wrapped in its own window and rises into it, one after another (styles.css),
// once the whole line is on screen. After a moment the words rise on out of their windows,
// and the "Open to work" strip rises into the same place and keeps running.
const RISE_HOLD = 1600; // milliseconds the line stays whole before it gives way to the strip
const rise = document.querySelector(".about-story__rise");
const riseText = rise.textContent;
rise.setAttribute("aria-label", riseText);
rise.innerHTML = "";
riseText.split(" ").forEach((word, index) => {
  const box = document.createElement("span");
  box.className = "about-story__word";
  box.setAttribute("aria-hidden", "true");
  const inner = document.createElement("span");
  inner.textContent = word;
  inner.style.setProperty("--i", index);
  box.append(inner);
  rise.append(box, " ");
});
// Coming back to the page (about.html adds .is-returning): the strip is already there, nothing plays
shown.then(() => {
  if (page.classList.contains("is-returning")) document.querySelector(".about-story").classList.add("is-settled");
});
// After the opening the page stays unscrollable (.is-holding, styles.css) until "Open to work" is in;
// if the line isn't on screen then (a short window), it lets go right away
let played = false;
shown.then(() => { played = page.classList.contains("intro"); });
introOver.then(() => {
  if (page.classList.contains("is-returning")) return;
  if (played) page.classList.add("is-holding");
  let first = true;
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) {
      if (first) page.classList.remove("is-holding");
      first = false;
      return;
    }
    rise.classList.add("is-in");
    observer.disconnect();
    const words = rise.querySelectorAll(".about-story__word").length;
    const risen = 900 + (words - 1) * 90; // the last word's delay plus its rise (styles.css)
    setTimeout(() => {
      rise.classList.add("is-out");
      setTimeout(() => {
        document.querySelector(".about-story__strip").classList.add("is-in");
        page.classList.remove("is-holding");
      }, 300);
    }, risen + RISE_HOLD);
  }, { threshold: 1 }).observe(rise);
});
