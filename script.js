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
  const half = cursor.offsetWidth / 2;
  cursor.style.transform = `translate(${event.clientX - half}px, ${event.clientY - half}px)`;

  // Over the About / Contact / IG and Email / IG / LinkedIn rows the circle hides and the normal cursor shows
  const overLinks = event.target.closest(".top-bar__links, .footer__links") !== null;
  cursor.classList.toggle("is-visible", !overLinks);
});

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  cursor.classList.remove("is-visible");
});
