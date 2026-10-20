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

function startAnimation() {
  // People who turned off animations in their system settings see the text standing still
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // All letters travel the same distance, so they move at the same speed:
  // far enough for the "C" to leave on the right,
  // and far enough for the last dot to start outside on the left.
  const screenWidth = document.documentElement.clientWidth;
  const first = letters[0];
  const last = letters[letters.length - 1];
  const exitRight = screenWidth - first.offsetLeft;
  const enterLeft = -(last.offsetLeft + last.offsetWidth);

  letters.forEach((letter, index) => {
    // Stop the old animation (needed when the window changes size)
    letter.getAnimations().forEach((animation) => animation.cancel());

    // The last dot is 0, so it moves first; the "C" moves last
    const order = letters.length - 1 - index;

    letter.animate(
      [
        { offset: 0,     transform: "translateX(0)", easing: EASE_OUT_OF_SCREEN },
        // Two keyframes at the same moment = an instant jump from the right edge
        // to the left edge, with no in-between frames (otherwise letters flash on screen)
        { offset: 0.2,   transform: `translateX(${exitRight}px)` },
        { offset: 0.2,   transform: `translateX(${enterLeft}px)` },
        { offset: 0.4,   transform: `translateX(${enterLeft}px)`, easing: EASE_BACK_IN }, // wait there
        { offset: 0.65,  transform: "translateX(0)" },               // back in place
        { offset: 1,     transform: "translateX(0)" },               // rest until the next round
      ],
      { duration: ROUND_TIME, delay: order * LETTER_GAP, iterations: Infinity }
    );
  });
}

// Start once the font has loaded (so the measurements are right),
// and start again whenever the window changes size
document.fonts.ready.then(startAnimation);
window.addEventListener("resize", startAnimation);

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

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  mouse = null;
  cursor.classList.remove("is-visible");
});

// ===== Letters that the circle pushes away =====
// The letters of the name and the tagline move away from the circle
// when it comes close, and spring back to their place when it leaves.
const PUSH_RADIUS = 60;   // how close (in px) the circle needs to be to push a letter
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

// Runs every frame: works out where each letter should be, and moves it a bit closer
function updatePushLetters() {
  pushLetters.forEach((letter) => {
    let targetX = 0;
    let targetY = 0;

    if (mouse) {
      const dx = letter.restX - mouse.x;
      const dy = letter.restY - mouse.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < PUSH_RADIUS) {
        // The closer the circle, the harder the push, straight away from its center
        const push = (1 - distance / PUSH_RADIUS) * PUSH_STRENGTH;
        targetX = (dx / distance) * push;
        targetY = (dy / distance) * push;
      }
    }

    letter.x += (targetX - letter.x) * SPRING;
    letter.y += (targetY - letter.y) * SPRING;
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
