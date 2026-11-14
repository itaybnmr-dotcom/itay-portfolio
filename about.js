// ===== About page =====
// People who turned off animations in their system settings see everything standing still
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Opening, like the home page's =====
// Black, then "So", a pause, and "yeah that's me..." word by word; then the rest of the text
// all at once; then the top bar, the globe and the top of the footer write themselves in. Each word rises in from just below
// its own spot, with the home page's styles (styles.css, "Intro"). about.html adds .intro.
// "And most importantly I am..." waits until the opening is over.
const INTRO_START = 600;                 // ms of black first, like the home page
const INTRO_BEATS = [0, 800, 950, 1100]; // when "So" "yeah" "that's" "me..." come in: the home page's beats
const text = document.querySelector(".about-story__text");
text.setAttribute("aria-label", text.textContent);
let introWords = 0;
function splitWords(element) {
  [...element.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return splitWords(node); // the bold words keep their <b>
    const parts = node.textContent.split(/( +)/).map((word) => {
      if (!word.trim()) return document.createTextNode(word); // the spaces stay plain text
      const beat = INTRO_BEATS[introWords++];
      const mask = document.createElement("span");
      mask.className = "intro__word";
      mask.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.textContent = word;
      inner.style.setProperty("--d", beat === undefined ? "var(--rest)" : `${INTRO_START + beat}ms`);
      mask.append(inner);
      return mask;
    });
    node.replaceWith(...parts);
  });
}
splitWords(text);
text.classList.add("is-split");

const page = document.documentElement;
const introOver = new Promise((done) => {
  if (!page.classList.contains("intro")) return done();
  const restStart = INTRO_START + INTRO_BEATS[INTRO_BEATS.length - 1] + 900;
  page.style.setProperty("--rest", `${restStart}ms`);
  const go = () => {
    page.classList.add("intro-go");
    // The footer (the last to write in) is done 900ms + 3 × 150ms + 1200ms after the rest of the text starts
    setTimeout(() => {
      page.classList.remove("intro", "intro-go");
      done();
    }, restStart + 900 + 3 * 150 + 1200);
  };
  // A page prepared in the background (the speculation rules) plays it once it's actually shown
  const whenShown = () => (document.prerendering ? document.addEventListener("prerenderingchange", go, { once: true }) : go());
  document.fonts.ready.then(whenShown);
});

// ===== The globe under "So yeah that's me..." =====
// Like the reference: six meridians, each one arc from pole to pole, crossing the equator at even gaps
// and sliding sideways; one that reaches the edge comes back in at the other side.
// It goes around twice, faster than the reference (left, one gap every 0.22s), slows down softly
// to a stop, rests a moment, picks up speed softly again, and goes around twice more, and so on.
const GLOBE_ARCS = 6;         // meridians
const GLOBE_GAP_TIME = 0.22;  // seconds for a meridian to slide one gap at full speed (the reference: 0.36)
const GLOBE_ROUNDS = 2;       // times around between stops (once around = all six gaps)
const GLOBE_EASE_TIME = 1;    // seconds it takes to slow down to a stop, and to speed up again
const GLOBE_REST = 0.3;       // seconds it rests between
const GLOBE_A = 54.75;        // half the globe's width, in the SVG's units
const GLOBE_B = 36.5;         // half its height
const meridians = [...document.querySelectorAll(".about-story__meridians path")];

// A meridian whose equator crossing is `u` of the way from the middle to the edge (-1 left, 1 right)
function meridianPath(u) {
  const rx = Math.abs(u) * GLOBE_A;
  if (rx < 0.01) return `M${GLOBE_A} 0V${2 * GLOBE_B}`; // through the middle: a straight line
  return `M${GLOBE_A} 0A${rx} ${GLOBE_B} 0 0 ${u > 0 ? 1 : 0} ${GLOBE_A} ${2 * GLOBE_B}`;
}

// How far it has gone (in times around) after `seconds`. One cycle: speed up, glide, slow down, rest.
// While speeding up its speed follows a smoothstep from 0 to full, so it covers half of what a full-speed
// stretch of the same time would; slowing down is the same backwards.
const SPEED = 1 / (GLOBE_GAP_TIME * GLOBE_ARCS);         // times around per second at full speed
const EASE_WAY = (SPEED * GLOBE_EASE_TIME) / 2;          // how far it goes while speeding up (or slowing down)
const GLIDE_TIME = (GLOBE_ROUNDS - 2 * EASE_WAY) / SPEED; // the full-speed stretch, so a cycle is GLOBE_ROUNDS times around
const CYCLE = 2 * GLOBE_EASE_TIME + GLIDE_TIME + GLOBE_REST;
const rampWay = (s) => s ** 3 - s ** 4 / 2; // distance under a smoothstep speed, 0 → 0.5
function globeWay(seconds) {
  const cycles = Math.floor(seconds / CYCLE);
  let t = seconds - cycles * CYCLE;
  let way = cycles * GLOBE_ROUNDS;
  if (t < GLOBE_EASE_TIME) return way + SPEED * GLOBE_EASE_TIME * rampWay(t / GLOBE_EASE_TIME);
  way += EASE_WAY; t -= GLOBE_EASE_TIME;
  if (t < GLIDE_TIME) return way + SPEED * t;
  way += SPEED * GLIDE_TIME; t -= GLIDE_TIME;
  if (t < GLOBE_EASE_TIME) return way + SPEED * GLOBE_EASE_TIME * (0.5 - rampWay(1 - t / GLOBE_EASE_TIME));
  return way + EASE_WAY; // resting
}

function drawGlobe(seconds) {
  const slide = globeWay(seconds);
  meridians.forEach((meridian, i) => {
    const place = (((i + 0.5) / GLOBE_ARCS - slide) % 1 + 1) % 1; // 0 = left edge, 1 = right edge
    meridian.setAttribute("d", meridianPath(place * 2 - 1));
  });
}

drawGlobe(0);
if (!reduceMotion) {
  requestAnimationFrame(function spin(now) {
    drawGlobe(now / 1000);
    requestAnimationFrame(spin);
  });
}

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
introOver.then(() => new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  rise.classList.add("is-in");
  observer.disconnect();
  const words = rise.querySelectorAll(".about-story__word").length;
  const risen = 900 + (words - 1) * 90; // the last word's delay plus its rise (styles.css)
  setTimeout(() => {
    rise.classList.add("is-out");
    setTimeout(() => document.querySelector(".about-story__strip").classList.add("is-in"), 300);
  }, risen + RISE_HOLD);
}, { threshold: 1 }).observe(rise));
