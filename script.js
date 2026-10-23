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
// On phones the headline breaks into two lines at the space (see styles.css)
letters.find((letter) => letter.textContent === " ").classList.add("letter--break");

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
//   "rain":     random letters rain down, then the real ones land and form the headline
//   "ticker":   three big sideways headlines, the middle one scrolling up, the others down
//   "tilt":     the letters as real objects that fall, pile up and can be thrown around
// Phones get their own list: motions that use the tall screen.
// Same width as the phone layout in styles.css.
const isPhone = window.matchMedia("(max-width: 700px)").matches;
const MOTIONS = isPhone
  ? ["falling", "tilt", "rain", "ticker", "wave"]
  : ["sideways", "falling", "cluster", "wave", "rain", "ticker", "tilt"];
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
// ===== Ticker: three big sideways headlines side by side, moved by styles.css =====
// The middle one scrolls up, the ones on its sides scroll down.
// Each has two identical halves, so moving by half loops with no visible jump.
const ticker = createLayer("ticker");
for (let i = 0; i < 3; i++) {
  const tickerText = document.createElement("div");
  tickerText.className = "ticker__text";
  tickerText.textContent = (title.getAttribute("aria-label") + " ").repeat(4);
  ticker.append(tickerText);
}

// ===== Tilt: the letters as real objects that fall, tumble and pile up =====
// Uses the Matter.js physics engine (loaded in index.html). Every letter is a
// solid block: it falls toward the low side of the phone, rotates, bumps into
// the other letters and the screen's edges, and stacks up. A finger or the mouse can grab a
// letter and throw it, and shaking the phone tosses them all around.
// Without a tilt sensor (a computer, or a phone that said no) they just fall down.
const SHAKE_FORCE = 0.0004; // how hard a shake tosses the letters
const THROW_STIFFNESS = 0.2; // how tightly a grabbed letter follows the finger

const tiltLayer = createLayer("tilt");
let tiltLetters = [];
let engine = null;
let gravity = { x: 0, y: 1 }; // down, until the tilt sensor says otherwise
let grab = null;              // the letter the finger is holding
let tiltRunning = false;
let tiltLastTime = null;

// Builds the letters and the walls (on page load, when the window changes size,
// and every time the tilt motion shows, so the headline collapses again)
function startTilt() {
  if (typeof Matter === "undefined") return; // the physics engine didn't load
  const { Engine, Bodies, Composite } = Matter;
  engine = Engine.create();
  engine.gravity.x = gravity.x;
  engine.gravity.y = gravity.y;
  tiltLayer.textContent = "";

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const fontSize = parseFloat(getComputedStyle(tiltLayer).fontSize);

  // Four walls just outside the screen's edges
  const wall = 200;
  Composite.add(engine.world, [
    Bodies.rectangle(width / 2, height + wall / 2, width * 3, wall, { isStatic: true }),
    Bodies.rectangle(width / 2, -wall / 2, width * 3, wall, { isStatic: true }),
    Bodies.rectangle(-wall / 2, height / 2, wall, height * 3, { isStatic: true }),
    Bodies.rectangle(width + wall / 2, height / 2, wall, height * 3, { isStatic: true }),
  ]);

  tiltLetters = letters
    .filter((letter) => letter.textContent !== " ")
    .map((letter) => {
      const element = document.createElement("span");
      element.className = "tilt__letter";
      element.textContent = letter.textContent;
      element.style.left = `${letter.offsetLeft}px`;
      element.style.top = `${letter.offsetTop}px`;
      tiltLayer.append(element);

      // The block is the size of the letter's ink, not its whole line box
      const homeX = letter.offsetLeft + letter.offsetWidth / 2;
      const homeY = letter.offsetTop + letter.offsetHeight / 2;
      const isDot = letter.textContent === ".";
      const blockWidth = letter.offsetWidth * 0.85;
      const blockHeight = isDot ? blockWidth : fontSize * 0.72;
      // A dot's ink sits low in its box, so its block (and the point it turns around) does too
      const drop = isDot ? fontSize * 0.3 : 0;
      element.style.transformOrigin = `50% calc(50% + ${drop}px)`;
      const body = Bodies.rectangle(homeX, homeY + drop, blockWidth, blockHeight, {
        restitution: 0.25, // a small bounce
        friction: 0.4,
        chamfer: { radius: Math.min(blockWidth, blockHeight) * 0.2 },
      });
      Composite.add(engine.world, body);
      return { element, body, homeX, homeY: homeY + drop };
    });
}

// Asks for the tilt and motion sensors (iPhones only allow it after a tap) and listens
function listenToTilt() {
  const listenTilt = () =>
    window.addEventListener("deviceorientation", (event) => {
      if (event.beta === null) return;
      // Which way is down on the screen, from how the phone is held
      const beta = (event.beta * Math.PI) / 180;
      const gamma = (event.gamma * Math.PI) / 180;
      gravity = { x: Math.cos(beta) * Math.sin(gamma), y: Math.sin(beta) };
    });
  const listenShake = () =>
    window.addEventListener("devicemotion", (event) => {
      const a = event.acceleration;
      if (!a || motion !== "tilt") return;
      const strength = Math.hypot(a.x || 0, a.y || 0);
      if (strength < 8) return; // a real shake, not a hand moving a bit
      tiltLetters.forEach(({ body }) => {
        Matter.Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * strength * SHAKE_FORCE * body.mass,
          y: (Math.random() - 0.5) * strength * SHAKE_FORCE * body.mass,
        });
      });
    });
  const ask = (Event, listen) => {
    if (typeof Event === "undefined") return;
    if (Event.requestPermission) {
      Event.requestPermission().then((answer) => answer === "granted" && listen()).catch(() => {});
    } else {
      listen();
    }
  };
  ask(window.DeviceOrientationEvent, listenTilt);
  ask(window.DeviceMotionEvent, listenShake);
}

// The finger grabs the letter under it and drags it; letting go throws it
function grabLetter(x, y) {
  if (motion !== "tilt" || !engine) return;
  const [body] = Matter.Query.point(tiltLetters.map((letter) => letter.body), { x, y });
  if (!body) return;
  grab = Matter.Constraint.create({
    pointA: { x, y },
    bodyB: body,
    pointB: { x: x - body.position.x, y: y - body.position.y },
    stiffness: THROW_STIFFNESS,
    damping: 0.1,
  });
  Matter.Composite.add(engine.world, grab);
}

function moveGrab(x, y) {
  if (grab) grab.pointA = { x, y };
}

function dropLetter() {
  if (grab) Matter.Composite.remove(engine.world, grab);
  grab = null;
}

function startTiltLoop() {
  if (tiltRunning) return;
  tiltRunning = true;
  tiltLastTime = null;
  requestAnimationFrame(updateTilt);
}

// Runs every frame while the tilt motion is showing
function updateTilt(now) {
  if (motion !== "tilt" || !engine) {
    tiltRunning = false;
    return;
  }
  // Time since the last frame, capped so a hiccup doesn't make letters jump through walls
  const step = tiltLastTime === null ? 1000 / 60 : Math.min(now - tiltLastTime, 1000 / 30);
  tiltLastTime = now;

  if (!reduceMotion) {
    engine.gravity.x = gravity.x;
    engine.gravity.y = gravity.y;
    Matter.Engine.update(engine, step);
  }

  tiltLetters.forEach(({ element, body, homeX, homeY }) => {
    const x = body.position.x - homeX;
    const y = body.position.y - homeY;
    element.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
  });

  requestAnimationFrame(updateTilt);
}

const LAYERS = { cluster, rain, ticker, tilt: tiltLayer };

// Shows the current motion: its own layer, or the big headline
function showMotion() {
  const hasLayer = motion in LAYERS;
  Object.entries(LAYERS).forEach(([name, layer]) => layer.classList.toggle("is-visible", name === motion));
  title.classList.toggle("is-hidden", hasLayer);
  if (motion === "tilt") {
    if (!tiltAsked) listenToTilt(); // still inside the tap, so iPhones allow asking
    tiltAsked = true;
    startTilt(); // the headline stands up again, then collapses
    startTiltLoop();
  }
  // Rain starts over from the first drop, instead of joining in the middle of a pause
  if (motion === "rain") startRain();
  if (!hasLayer) switchMotion();
}
let tiltAsked = false;

// Start once the font has loaded (so the measurements are right),
// and start again whenever the window changes size
function startEverything() {
  startAnimation();
  startCluster();
  startRain();
  startTilt();
}
document.fonts.ready.then(startEverything);
window.addEventListener("resize", startEverything);

// ===== Custom mouse cursor =====
// Creates a small white dot and moves it so its center
// is always at the mouse position.
const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

// Tells styles.css the circle is ready, so it can hide the normal arrow
document.documentElement.classList.add("has-custom-cursor");

// Where the mouse is right now (null = outside the window)
let mouse = null;

// Phones: the finger drags a grabbed letter of the tilt motion, and lets go when lifted.
// (Phones also fake a mousemove after each tap; it's ignored below.)
// A tap (finger lifted without dragging) switches the motion right away,
// instead of waiting for the click, which Safari doesn't always send.
let touchStart = null;
document.addEventListener("touchstart", (event) => {
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  grabLetter(touchStart.x, touchStart.y); // in the tilt motion: pick up a letter
}, { passive: true });
document.addEventListener("touchmove", (event) => {
  mouse = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  moveGrab(mouse.x, mouse.y);
}, { passive: true });
document.addEventListener("touchend", (event) => {
  mouse = null;
  const heldLetter = grab !== null;
  dropLetter();
  const finger = event.changedTouches[0];
  const dragged = !touchStart || Math.hypot(finger.clientX - touchStart.x, finger.clientY - touchStart.y) > 10;
  // Links keep working as links, and touching a letter doesn't switch the motion
  if (dragged || heldLetter || event.target.closest("a")) return;
  event.preventDefault(); // no click afterwards, so the motion doesn't switch twice
  nextMotion();
});

document.addEventListener("mousemove", (event) => {
  if (isPhone) return;
  mouse = { x: event.clientX, y: event.clientY };
  moveGrab(mouse.x, mouse.y);

  const half = cursor.offsetWidth / 2;
  cursor.style.transform = `translate(${event.clientX - half}px, ${event.clientY - half}px)`;

  // Over the About / Contact / IG row the circle hides and the normal cursor shows
  const overLinks = event.target.closest(".top-bar__links") !== null;
  cursor.classList.toggle("is-visible", !overLinks);
});

// Every left click switches the headline to the next way of moving
function nextMotion() {
  motion = MOTIONS[(MOTIONS.indexOf(motion) + 1) % MOTIONS.length];
  showMotion();
}
// With a mouse: press on a letter of the tilt motion to grab it, release to throw it.
// A click that grabbed a letter or dragged doesn't switch the motion.
let mouseDownAt = null;
let skipClick = false;
document.addEventListener("mousedown", (event) => {
  if (isPhone) return;
  mouseDownAt = { x: event.clientX, y: event.clientY };
  grabLetter(event.clientX, event.clientY);
  if (grab) event.preventDefault(); // no text selection while dragging
});
document.addEventListener("mouseup", (event) => {
  const dragged = mouseDownAt && Math.hypot(event.clientX - mouseDownAt.x, event.clientY - mouseDownAt.y) > 10;
  skipClick = grab !== null || dragged;
  dropLetter();
});
document.addEventListener("click", () => {
  if (skipClick) {
    skipClick = false;
    return;
  }
  nextMotion();
});

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  mouse = null;
  cursor.classList.remove("is-visible");
});
