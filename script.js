// Splits the headline into single letters and moves them one after another:
// each letter flies off the screen to the right and comes back in from the left.
const title = document.querySelector(".coming-soon__title");
const text = title.textContent;
const chars = [...text];

// Screen readers read the whole sentence, not letter by letter
title.setAttribute("aria-label", text);
title.textContent = "";

const letters = chars.map((char) => {
  const letter = document.createElement("span");
  letter.className = "letter";
  letter.textContent = char;
  letter.setAttribute("aria-hidden", "true");
  title.append(letter);
  return letter;
});

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
