// ===== The log =====
// Starts a row's video (if it has one) from the beginning
function replay(entry) {
  const video = entry.querySelector("video");
  if (!video) return;
  video.currentTime = 0;
  video.play();
}

const entries = document.querySelectorAll(".process__entry");
const isPhone = window.matchMedia("(max-width: 700px)"); // same width as the phone layout in styles.css

entries.forEach((entry) => {
  // Computer: hovering a row peeks at it
  entry.addEventListener("mouseenter", () => replay(entry));

  // Phone: tapping a row opens its drawer (and closes the one that was open)
  entry.addEventListener("click", () => {
    if (!isPhone.matches) return;
    const opening = !entry.classList.contains("is-open");
    entries.forEach((other) => other.classList.remove("is-open"));
    entry.classList.toggle("is-open", opening);
    if (!opening) return;
    replay(entry);
    navigator.vibrate?.(8); // a tiny haptic "tick" (Android; iPhones ignore it)
  });
});

// ===== Headline animation =====
// Like the first "Coming soon" motion, letter by letter from the end:
// the dots fly off to the right first, then "Progress", "in", "Work" and last "The".
// Each letter comes back in from the left.
const title = document.querySelector(".process__title");
const canvas = document.querySelector(".process");

// Splits the headline into single letters (one <span> each).
// The gaps stay plain text, so they don't count as letters and add no wait between words.
const text = title.textContent;
title.setAttribute("aria-label", text); // screen readers read the whole text
title.textContent = "";
const letters = [];
for (const char of text) {
  if (char === " ") {
    title.append(char);
    continue;
  }
  const letter = document.createElement("span");
  letter.className = "letter";
  letter.textContent = char;
  letter.setAttribute("aria-hidden", "true");
  title.append(letter);
  letters.push(letter);
}

// Separate letters lose the font's kerning (like the tight "Wo"), so it's measured
// for each pair and added back as a margin, to match Figma
function kernLetters() {
  const style = getComputedStyle(title);
  const size = parseFloat(style.fontSize);
  const ink = document.createElement("canvas").getContext("2d");
  ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const width = (chars) => ink.measureText(chars).width;
  letters.forEach((letter) => {
    const before = letter.previousSibling;
    if (!before?.classList) return; // first letter of a word
    const kern = width(before.textContent + letter.textContent) - width(before.textContent) - width(letter.textContent);
    letter.style.marginLeft = `${kern / size}em`;
  });
}
document.fonts.ready.then(kernLetters); // the font has to be loaded to measure it

const ROUND_TIME = 6000; // one full round, in milliseconds
const LETTER_GAP = 80;   // how much later each letter starts than the one after it
const EASE_OUT_OF_SCREEN = "cubic-bezier(0.32, 0, 0.67, 0)"; // starts gently, speeds up as it leaves
const EASE_BACK_IN = "cubic-bezier(0.25, 1, 0.5, 1)";        // comes in quickly, slows down softly

function startHeadline() {
  title.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());

  // All letters travel the same distance, so they move at the same speed:
  // far enough for the "T" to pass the right edge and for the last dot to hide past the left edge
  const first = letters[0];
  const last = letters[letters.length - 1];
  const right = canvas.offsetWidth - (title.offsetLeft + first.offsetLeft);
  const left = -(title.offsetLeft + last.offsetLeft + last.offsetWidth);
  const at = (x) => `translateX(${x}px)`;

  letters.forEach((letter, index) => {
    letter.animate(
      [
        { offset: 0,    transform: at(0), easing: EASE_OUT_OF_SCREEN },
        // Two keyframes at the same moment = an instant jump from one edge to the other
        { offset: 0.2,  transform: at(right) },
        { offset: 0.2,  transform: at(left) },
        { offset: 0.4,  transform: at(left), easing: EASE_BACK_IN }, // wait outside
        { offset: 0.65, transform: at(0) },                          // back in place
        { offset: 1,    transform: at(0) },                          // rest until the next round
      ],
      // The last dot first, the "T" last
      { duration: ROUND_TIME, delay: (letters.length - 1 - index) * LETTER_GAP, iterations: Infinity }
    );
  });
}

// People who turned off animations in their system settings see the text standing still
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.fonts.ready.then(startHeadline); // letter widths are only right once the font loaded (and kerned, above)
  window.addEventListener("resize", () => {
    if (!engine) startHeadline(); // once the letters fell, they stay where they are
  });
}

// ===== Falling letters =====
// Clicking the headline drops its letters: each one becomes a solid block that falls,
// tumbles and piles up at the bottom of the screen. The mouse (or a finger) can grab
// a letter and drag it; letting go throws it. Clicking a fallen letter (without dragging it)
// gathers them all back into the headline, and the sideways motion starts again.
// Uses the Matter.js physics engine (loaded in index.html).
const THROW_STIFFNESS = 0.2; // how tightly a grabbed letter follows the mouse
const GATHER_TIME = 900;     // how long the letters take to fly back into place, in milliseconds
let engine = null;
let fallingLetters = [];
let grab = null;      // the letter being dragged
let pressedAt = null; // where the mouse went down, to tell a click from a drag

title.addEventListener("click", (event) => {
  if (typeof Matter === "undefined") return; // the physics engine didn't load
  if (!engine) {
    dropLetters();
    return;
  }
  // Letting go after a drag also counts as a click; only a real click gathers the letters
  const moved = pressedAt ? Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) : 0;
  if (moved < 5) gatherLetters();
});

function dropLetters() {
  const { Engine, Bodies, Composite } = Matter;

  // The letters stop their sideways motion and fall from where they stand at rest
  title.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());

  engine = Engine.create();
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  // Four walls just outside the screen's edges. The floor sits 14px up
  // (the page's side margin), so the letters don't touch the bottom edge.
  const wall = 200;
  const floor = height - 14;
  Composite.add(engine.world, [
    Bodies.rectangle(width / 2, floor + wall / 2, width * 3, wall, { isStatic: true }),
    Bodies.rectangle(width / 2, -wall / 2, width * 3, wall, { isStatic: true }),
    Bodies.rectangle(-wall / 2, height / 2, wall, height * 3, { isStatic: true }),
    Bodies.rectangle(width + wall / 2, height / 2, wall, height * 3, { isStatic: true }),
  ]);

  // Measures each letter's ink (where it's actually drawn), so the blocks rest on their real edges
  const style = getComputedStyle(title);
  const ink = document.createElement("canvas").getContext("2d");
  ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const baseline = ink.measureText("H").fontBoundingBoxAscent; // from the top of a letter's box

  fallingLetters = letters.map((letter) => {
    const box = letter.getBoundingClientRect();
    const size = ink.measureText(letter.textContent);
    const blockWidth = size.actualBoundingBoxLeft + size.actualBoundingBoxRight;
    const blockHeight = size.actualBoundingBoxAscent + size.actualBoundingBoxDescent;
    // The ink's center, measured from the letter box's top-left corner; the letter turns around it
    const centerX = (size.actualBoundingBoxRight - size.actualBoundingBoxLeft) / 2;
    const centerY = baseline + (size.actualBoundingBoxDescent - size.actualBoundingBoxAscent) / 2;
    letter.style.transformOrigin = `${centerX}px ${centerY}px`;
    const homeX = box.left + centerX;
    const homeY = box.top + centerY;
    const body = Bodies.rectangle(homeX, homeY, blockWidth, blockHeight, {
      restitution: 0.25, // a small bounce
      friction: 0.4,
      chamfer: { radius: Math.min(blockWidth, blockHeight) * 0.2 },
    });
    Composite.add(engine.world, body);
    return { letter, body, homeX, homeY };
  });

  let lastTime = null;
  const world = engine;
  requestAnimationFrame(function update(now) {
    if (engine !== world) return; // the letters were gathered back
    // Time since the last frame, capped so a hiccup doesn't make letters jump through walls
    const step = lastTime === null ? 1000 / 60 : Math.min(now - lastTime, 1000 / 30);
    lastTime = now;
    Matter.Engine.update(engine, step);
    fallingLetters.forEach(({ letter, body, homeX, homeY }) => {
      const x = body.position.x - homeX;
      const y = body.position.y - homeY;
      letter.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
    });
    requestAnimationFrame(update);
  });
}

// Every letter flies from where it lies back to its place in the headline
// (the last dot first, like the sideways motion), then the sideways motion carries on
function gatherLetters() {
  engine = null;
  grab = null;
  const flights = fallingLetters.map(({ letter }, index) => {
    const from = letter.style.transform;
    letter.style.transform = "";
    return letter.animate([{ transform: from }, { transform: "none" }], {
      duration: GATHER_TIME,
      delay: (letters.length - 1 - index) * (LETTER_GAP / 2),
      easing: EASE_BACK_IN,
      fill: "backwards", // stays where it lies until its turn
    }).finished;
  });
  fallingLetters = [];
  Promise.all(flights).then(() => {
    if (engine) return; // dropped again on the way back
    letters.forEach((letter) => (letter.style.transformOrigin = ""));
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) startHeadline();
  }).catch(() => {}); // a click on the way back drops them again, which cancels the flights
}

// Grabs the letter under the mouse and drags it; letting go throws it
document.addEventListener("pointerdown", (event) => {
  const point = { x: event.clientX, y: event.clientY };
  pressedAt = point;
  if (!engine) return;
  const [body] = Matter.Query.point(fallingLetters.map((letter) => letter.body), point);
  if (!body) return;
  grab = Matter.Constraint.create({
    pointA: point,
    bodyB: body,
    pointB: { x: point.x - body.position.x, y: point.y - body.position.y },
    stiffness: THROW_STIFFNESS,
    damping: 0.1,
  });
  Matter.Composite.add(engine.world, grab);
});

document.addEventListener("pointermove", (event) => {
  if (grab) grab.pointA = { x: event.clientX, y: event.clientY };
});

document.addEventListener("pointerup", () => {
  if (!grab) return;
  Matter.Composite.remove(engine.world, grab);
  grab = null;
});
