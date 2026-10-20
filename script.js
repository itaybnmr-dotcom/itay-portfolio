// Splits the text of an element into single letters (one <span> each),
// so every letter can move on its own. Returns the list of letters.
function splitIntoLetters(element, className) {
  const text = element.textContent;

  // Screen readers read the whole text, not letter by letter
  element.setAttribute("aria-label", text);
  element.textContent = "";

  return [...text].map((char) => {
    const letter = document.createElement("span");
    letter.className = className;
    letter.textContent = char;
    letter.setAttribute("aria-hidden", "true");
    element.append(letter);
    return letter;
  });
}

// ===== Headline animation =====
// The letters move one after another: each one flies off the screen
// to the right and comes back in from the left.
const title = document.querySelector(".coming-soon__title");
const letters = splitIntoLetters(title, "letter");

// Animation settings
const ROUND_TIME = 6000;    // one full round, in milliseconds
const LETTER_GAP = 80;      // how much later each letter starts than the one before it
const EASE_OUT_OF_SCREEN = "cubic-bezier(0.32, 0, 0.67, 0)"; // starts gently, speeds up as it leaves
const EASE_BACK_IN = "cubic-bezier(0.25, 1, 0.5, 1)";        // comes in quickly, slows down softly

// The ways the headline can move. Every click switches to the next one.
//   "sideways": out to the right, back in from the left (the default)
//   "falling":  out the bottom, back in from the top
//   "cluster":  a small group of little copies, moving like "sideways"
//   "wave":     a wave runs through the headline; letters jump, stretch and squash
//   "carousel": the letters spin in a ring, steered by the mouse
//   "rain":     random letters rain down, then the real ones land and form the headline
const MOTIONS = ["sideways", "falling", "cluster", "wave", "carousel", "rain"];
let motion = MOTIONS[0];

// Where each letter of the headline goes in the current motion:
// "exit" = how far it moves to leave the screen, "enter" = where it waits to come back in.
// All letters travel the same distance, so they move at the same speed.
function getPaths() {
  const box = title.getBoundingClientRect();
  const first = letters[0];
  const last = letters[letters.length - 1];

  // Distances (in px) that take every letter just past each edge of the screen
  const right = document.documentElement.clientWidth - first.offsetLeft; // the "C" passes the right edge
  const left = -(last.offsetLeft + last.offsetWidth);                    // the last dot passes the left edge
  const down = document.documentElement.clientHeight - box.top;          // the top of the letters passes the bottom
  const up = -box.bottom;                                                // the bottom of the letters passes the top

  const toRight = { exit: { x: right, y: 0 }, enter: { x: left, y: 0 } };
  const toBottom = { exit: { x: 0, y: down }, enter: { x: 0, y: up } };

  return letters.map(() => {
    if (motion === "falling") return toBottom;
    return toRight; // "sideways" (and the headline's path while the cluster shows)
  });
}

// When each letter starts: the last dot first, the "C" last
function getOrder(index) {
  return letters.length - 1 - index;
}

// People who turned off animations in their system settings see the text standing still
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Parts of a round (0.2 = 20% into it)
const OFF_SCREEN = [0.2, 0.4]; // waiting outside the screen
const IN_PLACE = [0.65, 1];    // resting in its place

const letterAnimations = [];  // the current animation of each letter

// Starts one round-after-round animation for one letter, along the given path,
// starting after `delay` milliseconds. Returns the animation.
function animateOneLetter(letter, delay, { exit, enter }) {
  const at = ({ x, y }) => `translate(${x}px, ${y}px)`;
  const home = { x: 0, y: 0 };
  return letter.animate(
    [
      { offset: 0,             transform: at(home), easing: EASE_OUT_OF_SCREEN },
      // Two keyframes at the same moment = an instant jump from one edge
      // to the other, with no in-between frames (otherwise letters flash on screen)
      { offset: OFF_SCREEN[0], transform: at(exit) },  // just past the far edge
      { offset: OFF_SCREEN[0], transform: at(enter) }, // just outside the near edge
      { offset: OFF_SCREEN[1], transform: at(enter), easing: EASE_BACK_IN }, // wait there
      { offset: IN_PLACE[0],   transform: at(home) },  // back in place
      { offset: IN_PLACE[1],   transform: at(home) },  // rest until the next round
    ],
    { duration: ROUND_TIME, delay, iterations: Infinity }
  );
}

// ===== Wave =====
const WAVE_TIME = 2400; // one wave, in milliseconds
const WAVE_GAP = 70;    // how much later each letter jumps than the one before it

// One letter riding the wave: it jumps up while stretching, lands squashed,
// then settles and waits for the next wave
function animateWave(letter, delay) {
  return letter.animate(
    [
      { offset: 0,    transform: "translateY(0) scaleY(1)", easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
      { offset: 0.18, transform: "translateY(-0.3em) scaleY(1.15)", easing: "cubic-bezier(0.6, 0, 0.8, 0.4)" },
      { offset: 0.34, transform: "translateY(0) scaleY(0.85)", easing: "ease-out" },
      { offset: 0.46, transform: "translateY(0) scaleY(1)" },
      { offset: 1,    transform: "translateY(0) scaleY(1)" },
    ],
    { duration: WAVE_TIME, delay, iterations: Infinity }
  );
}

// Starts the right animation for one letter of the big headline
function animateLetter(index, path) {
  letterAnimations[index] =
    motion === "wave"
      ? animateWave(letters[index], index * WAVE_GAP) // the wave runs from the "C" to the dots
      : animateOneLetter(letters[index], getOrder(index) * LETTER_GAP, path);
}

// Starts all letters from the beginning (on page load and when the window changes size)
function startAnimation() {
  if (reduceMotion) return;
  letterAnimations.forEach((animation) => animation.cancel());
  const paths = getPaths();
  letters.forEach((letter, index) => animateLetter(index, paths[index]));
}

// Switches every letter to the current motion right away ("snap"):
// each letter cuts to the same point of the round in the new motion
// and keeps going from there, with no pause and no restart.
function switchMotion() {
  if (reduceMotion || letterAnimations.length === 0) return; // not started yet (font still loading)
  const paths = getPaths();

  letters.forEach((letter, index) => {
    const time = letterAnimations[index].currentTime;
    letterAnimations[index].cancel();
    animateLetter(index, paths[index]);
    letterAnimations[index].currentTime = time;
  });
}

// ===== Cluster: a small group of little headline copies =====
// A few rows of small "COMING SOON..." in the middle of the screen.
// Their letters move like the big headline ("sideways"), and each row
// starts a little after the one above it.
const CLUSTER_ROWS = 16;
const ROW_GAP = 120; // how much later each row starts than the one above it

// Creates a full-screen layer for a motion that has its own letters
// (hidden until its motion is showing)
function createLayer(className) {
  const layer = document.createElement("div");
  layer.className = className;
  layer.setAttribute("aria-hidden", "true");
  document.querySelector("main").append(layer);
  return layer;
}

const cluster = createLayer("cluster");

const clusterRows = [];
for (let i = 0; i < CLUSTER_ROWS; i++) {
  const row = document.createElement("div");
  row.className = "cluster__row";
  row.textContent = title.getAttribute("aria-label"); // "COMING SOON..."
  cluster.append(row);
  clusterRows.push(splitIntoLetters(row, "letter"));
}

let clusterAnimations = [];

// Starts the cluster's letters (on page load and when the window changes size)
function startCluster() {
  if (reduceMotion) return;
  clusterAnimations.forEach((animation) => animation.cancel());

  // The cluster must be shown (invisibly) to be measured
  cluster.style.display = "flex";
  cluster.style.visibility = "hidden";
  const box = cluster.getBoundingClientRect();
  cluster.style.display = "";
  cluster.style.visibility = "";

  // Far enough for every letter to leave on the right and start outside on the left
  const path = {
    exit: { x: document.documentElement.clientWidth - box.left, y: 0 },
    enter: { x: -box.right, y: 0 },
  };

  clusterAnimations = clusterRows.flatMap((rowLetters, row) =>
    rowLetters.map((letter, index) => {
      const order = rowLetters.length - 1 - index; // the dots move first
      return animateOneLetter(letter, row * ROW_GAP + order * LETTER_GAP, path);
    })
  );
}

// ===== Carousel: a cluster of letter rings spinning together, steered by the mouse =====
// Rings of letters stacked on top of each other, like a cylinder made of text.
// Each ring is turned a little more than the one above it, so the cylinder twists.
// Seen from the side: letters at the front are big and bright, at the back
// small and faint. Mouse on the right spins it right, on the left spins it left;
// the further from the middle, the faster.
const CAROUSEL_RINGS = 9;        // how many rings are stacked
const CAROUSEL_COPIES = 2;       // how many times "COMING SOON..." goes around each ring
const CAROUSEL_TWIST = 0.18;     // how much each ring is turned compared to the one above (radians)
const CAROUSEL_MAX_SPEED = 2.5;  // radians per second, with the mouse at the screen's edge
const CAROUSEL_IDLE_SPEED = 0.4; // when the mouse is outside the window

const carousel = createLayer("carousel");
const ringChars = [...(title.getAttribute("aria-label") + " ").repeat(CAROUSEL_COPIES)];
const carouselLetters = [];
for (let ring = 0; ring < CAROUSEL_RINGS; ring++) {
  ringChars.forEach((char, slot) => {
    const element = document.createElement("span");
    element.className = "carousel__letter";
    element.textContent = char;
    carousel.append(element);
    // ring: which ring it's in (0 = top); around: where around the ring (0 to 1)
    carouselLetters.push({ element, ring, around: slot / ringChars.length });
  });
}

let carouselAngle = 0;
let carouselRunning = false;
let carouselLastTime = null;

// Starts the spinning (if it isn't already running)
function startCarousel() {
  if (carouselRunning) return;
  carouselRunning = true;
  carouselLastTime = null;
  requestAnimationFrame(updateCarousel);
}

// Runs every frame while the carousel is showing
function updateCarousel(now) {
  if (motion !== "carousel") {
    carouselRunning = false;
    return; // stops until the carousel is shown again
  }
  const seconds = carouselLastTime === null ? 0 : (now - carouselLastTime) / 1000;
  carouselLastTime = now;

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const speed = mouse ? (mouse.x / width - 0.5) * 2 * CAROUSEL_MAX_SPEED : CAROUSEL_IDLE_SPEED;
  if (!reduceMotion) carouselAngle += speed * seconds;

  const radius = width * 0.3;
  const ringGap = height * 0.065; // distance between rings
  carouselLetters.forEach(({ element, ring, around }) => {
    const angle = carouselAngle + around * 2 * Math.PI + ring * CAROUSEL_TWIST;
    const depth = (Math.cos(angle) + 1) / 2; // 1 = right at the front, 0 = right at the back
    const x = width / 2 + Math.sin(angle) * radius;
    const ringY = (ring - (CAROUSEL_RINGS - 1) / 2) * ringGap; // stacks the rings around the middle
    const y = height / 2 + ringY + (depth - 0.5) * height * 0.08; // front a bit lower, back a bit higher
    element.style.transform = `translate(${x}px, ${y}px) scale(${0.45 + 0.55 * depth}) translate(-50%, -50%)`;
    element.style.opacity = 0.2 + 0.8 * depth;
    element.style.zIndex = Math.round(depth * 100); // front letters cover back ones
  });

  requestAnimationFrame(updateCarousel);
}

// ===== Rain: random letters rain down, then the real ones land =====
// Above every letter of the headline, a few random letters fall through the
// screen. Then the real letter drops in and lands in its place with a small
// bounce. Once the headline has formed, it falls out the bottom and it starts over.
const RAIN_TIME = 6000;      // one round, in milliseconds
const RAIN_COLUMN_GAP = 90;  // how much later each column starts than the one before it
const RAIN_DECOYS = 4;       // random letters falling in each column before the real one

const rain = createLayer("rain");
const rainChars = [...title.getAttribute("aria-label").replace(/ /g, "")];
let rainAnimations = [];

// Builds the columns over the headline's letters (on page load and when the window changes size)
function startRain() {
  rainAnimations.forEach((animation) => animation.cancel());
  rainAnimations = [];
  rain.textContent = "";

  const height = document.documentElement.clientHeight;

  letters.forEach((letter, column) => {
    if (letter.textContent === " ") return;

    // Starts just above the screen, ends just below it
    const up = -(letter.offsetTop + letter.offsetHeight);
    const down = height - letter.offsetTop;

    const addLetter = (char, className) => {
      const element = document.createElement("span");
      element.className = className;
      element.textContent = char;
      element.style.left = `${letter.offsetLeft}px`;
      element.style.top = `${letter.offsetTop}px`;
      rain.append(element);
      return element;
    };
    const play = (element, keyframes) => {
      if (reduceMotion) return;
      rainAnimations.push(
        element.animate(keyframes, { duration: RAIN_TIME, delay: column * RAIN_COLUMN_GAP, iterations: Infinity })
      );
    };

    // The random letters: each one falls straight through, one after another
    for (let k = 0; k < RAIN_DECOYS; k++) {
      const start = 0.02 + k * 0.06;
      const char = rainChars[Math.floor(Math.random() * rainChars.length)];
      play(addLetter(char, "rain__letter rain__letter--random"), [
        { offset: 0,            transform: `translateY(${up}px)` },
        { offset: start,        transform: `translateY(${up}px)`, easing: "cubic-bezier(0.4, 0, 1, 1)" },
        { offset: start + 0.12, transform: `translateY(${down}px)` },
        { offset: 1,            transform: `translateY(${down}px)` },
      ]);
    }

    // The real letter: waits, drops in with a small bounce, stays, then falls out
    play(addLetter(letter.textContent, "rain__letter"), [
      { offset: 0,    transform: `translateY(${up}px)` },
      { offset: 0.3,  transform: `translateY(${up}px)`, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
      { offset: 0.45, transform: "translateY(0)" },
      { offset: 0.8,  transform: "translateY(0)", easing: EASE_OUT_OF_SCREEN },
      { offset: 0.92, transform: `translateY(${down}px)` },
      { offset: 1,    transform: `translateY(${down}px)` },
    ]);
  });
}

// The motions that have their own layer (the others move the big headline)
const LAYERS = { cluster, carousel, rain };

// Shows the current motion: its own layer, or the big headline
function showMotion() {
  const hasLayer = motion in LAYERS;
  Object.entries(LAYERS).forEach(([name, layer]) => layer.classList.toggle("is-visible", name === motion));
  title.classList.toggle("is-hidden", hasLayer);
  if (motion === "carousel") startCarousel();
  if (!hasLayer) switchMotion();
}

// Start once the font has loaded (so the measurements are right),
// and start again whenever the window changes size
function startEverything() {
  startAnimation();
  startCluster();
  startRain();
}
document.fonts.ready.then(startEverything);
window.addEventListener("resize", startEverything);

// ===== Custom mouse cursor =====
// Creates a white circle with "coming soon" and moves it so its center
// is always at the mouse position.
const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.textContent = "coming soon";
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

// Tells styles.css the circle is ready, so it can hide the normal arrow
document.documentElement.classList.add("has-custom-cursor");

// Where the mouse is right now (null = outside the window)
let mouse = null;

document.addEventListener("mousemove", (event) => {
  mouse = { x: event.clientX, y: event.clientY };

  const half = cursor.offsetWidth / 2;
  cursor.style.transform = `translate(${event.clientX - half}px, ${event.clientY - half}px)`;

  // Over the About / Contact / IG row the circle hides and the normal cursor shows
  const overLinks = event.target.closest(".top-bar__links") !== null;
  cursor.classList.toggle("is-visible", !overLinks);
});

// Every left click switches the circle to another color palette
// (the palettes themselves are in styles.css)
const PALETTE_COUNT = 7;

document.addEventListener("click", () => {
  const current = Number(cursor.dataset.palette) || 0;
  let next = current;
  while (next === current) {
    next = 1 + Math.floor(Math.random() * PALETTE_COUNT); // never the same one twice in a row
  }
  cursor.dataset.palette = next;

  // ...and switches the headline to the next way of moving
  motion = MOTIONS[(MOTIONS.indexOf(motion) + 1) % MOTIONS.length];
  showMotion();
});

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  mouse = null;
  cursor.classList.remove("is-visible");
});

// ===== Letters that the circle pushes away =====
// The letters of the name and the tagline move away from the circle
// when it comes close, and spring back to their place when it leaves.
const PUSH_RADIUS = 70;   // how close (in px) the circle needs to be to push a letter
const PUSH_STRENGTH = 20; // how far (in px) a letter moves when the circle is right on it
const SPRING = 0.15;      // how fast letters follow (0 to 1: higher = snappier)

const pushLetters = [
  ...splitIntoLetters(document.querySelector(".top-bar__name"), "push-letter"),
  ...splitIntoLetters(document.querySelector(".top-bar__tagline"), "push-letter"),
].map((element) => ({ element, restX: 0, restY: 0, x: 0, y: 0 }));

// Remembers where each letter's center is when it isn't pushed
function measurePushLetters() {
  pushLetters.forEach((letter) => {
    const box = letter.element.getBoundingClientRect();
    letter.restX = box.left + box.width / 2 - letter.x;
    letter.restY = box.top + box.height / 2 - letter.y;
  });
}

// How far the circle pushes something that sits at (x, y): the closer the
// circle, the harder the push, straight away from its center
function getPush(x, y, radius, strength) {
  if (!mouse) return { x: 0, y: 0 };
  const dx = x - mouse.x;
  const dy = y - mouse.y;
  const distance = Math.hypot(dx, dy) || 1;
  if (distance >= radius) return { x: 0, y: 0 };
  const push = (1 - distance / radius) * strength;
  return { x: (dx / distance) * push, y: (dy / distance) * push };
}

// Runs every frame: works out where each letter should be, and moves it a bit closer
function updatePushLetters() {
  pushLetters.forEach((letter) => {
    const target = getPush(letter.restX, letter.restY, PUSH_RADIUS, PUSH_STRENGTH);
    letter.x += (target.x - letter.x) * SPRING;
    letter.y += (target.y - letter.y) * SPRING;
    letter.element.style.transform = `translate(${letter.x}px, ${letter.y}px)`;
  });

  requestAnimationFrame(updatePushLetters);
}

// Only with a mouse, and not for people who turned off animations
const canPush =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canPush) {
  document.fonts.ready.then(() => {
    measurePushLetters();
    requestAnimationFrame(updatePushLetters);
  });
  window.addEventListener("resize", measurePushLetters);
}
