// ===== Custom mouse cursor =====
// Creates a small white dot and moves it so its center
// is always at the mouse position.
const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

// Tells styles.css the circle is ready, so it can hide the normal arrow
document.documentElement.classList.add("has-custom-cursor");

document.addEventListener("mousemove", (event) => {
  cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  // Over a link the circle hides and only the hand shows
  cursor.classList.toggle("is-visible", event.target.closest("a") === null);
});

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  cursor.classList.remove("is-visible");
});

// ===== Roll =====
// Splits both words of every .roll link into letters, numbered so each one starts a bit later
document.querySelectorAll(".roll > span").forEach((word) => {
  const text = word.textContent;
  word.textContent = "";
  [...text].forEach((char, index) => {
    const letter = document.createElement("span");
    letter.className = "roll__letter";
    letter.style.setProperty("--i", index);
    letter.textContent = char;
    word.append(letter);
  });
});

// ===== Tapping a link on a touch screen =====
// The line shows on the tap (styles.css, .is-tapped), and the page opens right away
if (window.matchMedia("(hover: none)").matches) {
  document.addEventListener("click", (event) => {
    event.target.closest("a.link-line")?.classList.add("is-tapped");
  });

  // Coming back (Back button, or from the Instagram tab) shows the page as it was left: clear the line
  const clearLines = () => document.querySelectorAll(".is-tapped").forEach((link) => link.classList.remove("is-tapped"));
  window.addEventListener("pageshow", clearLines);
  document.addEventListener("visibilitychange", clearLines);
}
