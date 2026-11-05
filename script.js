// ===== A refresh starts at the top =====
// Not where the page was left, nor at a #works or #contact it had jumped to: the # is dropped
// from the address, and the page is put back at the top once it has loaded (and again right after,
// for browsers that restore their spot late). Without the smooth scrolling, so it doesn't glide up
history.scrollRestoration = "manual";
if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
  history.replaceState(null, "", location.pathname + location.search);
  const toTop = () => {
    document.documentElement.style.scrollBehavior = "auto";
    scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = "";
  };
  toTop();
  addEventListener("load", () => {
    toTop();
    setTimeout(toTop, 50);
  });
}

// ===== Custom mouse cursor =====
// Creates a small white dot and moves it so its center
// is always at the mouse position.
const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

// Tells styles.css the circle is ready, so it can hide the normal arrow
document.documentElement.classList.add("has-custom-cursor");

// ===== Rings of words =====
// A card's word written around a circle as many times as fits (four "Reach", two "Record Day").
// The circle is cut into that many equal slots: each word starts its slot at its natural spacing,
// and its dot sits in the middle of what's left. Every word and dot is placed on its own, so a
// browser measuring a little differently can't push the last dot off the end of the circle.
// Each letter is its own tspan, so the stickers can write them in one by one (styles.css)
const RING = 257; // the circle's length (its radius is 41)
function writeRing(textPath, word) {
  const text = textPath.parentNode;
  const href = textPath.getAttribute("href");
  // A width taken between two letters, so no browser leaves out a space or letter spacing at an end
  const measure = (string) => {
    textPath.textContent = string;
    return textPath.getComputedTextLength();
  };
  const width = (string) => measure(`a${string}a`) - measure("aa");
  const wordWidth = width(word);
  const dotWidth = width("·");
  const times = Math.max(1, Math.floor(RING / (wordWidth + width(" · ")) + 0.05)); // a hair tight is fine
  const slot = RING / times;
  let index = 0;
  const piece = (string, offset) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
    path.setAttribute("href", href);
    path.setAttribute("startOffset", offset);
    path.append(...[...string].map((char) => {
      const letter = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      letter.textContent = char;
      letter.style.setProperty("--i", index++);
      return letter;
    }));
    return path;
  };
  const pieces = [];
  for (let k = 0; k < times; k++) {
    pieces.push(piece(word, k * slot));
    pieces.push(piece("·", k * slot + wordWidth + (slot - wordWidth - dotWidth) / 2));
  }
  text.replaceChildren(...pieces);
}

// Touch screens: the cards' stickers (the only time they're shown), once their font is in
if (matchMedia("(hover: none)").matches) {
  document.fonts.ready.then(() => {
    document.querySelectorAll(".work__sticker textPath").forEach((textPath) => {
      writeRing(textPath, textPath.closest("[data-cursor]").dataset.cursor);
    });
  });
}

// Over anything with data-cursor (the work cards) the circle grows, takes the card's colors
// (--circle and --circle-ink in styles.css) and its word goes around inside it
let cursorWord = null;
function showWord(card) {
  const word = card ? card.dataset.cursor : null;
  if (word === cursorWord) return;
  cursorWord = word;
  cursor.classList.toggle("is-big", word !== null);
  if (word === null) return;
  const colors = getComputedStyle(card);
  cursor.style.setProperty("--circle", colors.getPropertyValue("--circle"));
  cursor.style.setProperty("--circle-ink", colors.getPropertyValue("--circle-ink"));
  cursor.innerHTML = `<svg class="cursor__ring" viewBox="0 0 120 120">
    <path id="cursor-ring" d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0" fill="none"/>
    <text><textPath href="#cursor-ring"></textPath></text>
  </svg>`;
  writeRing(cursor.querySelector("textPath"), word);
}

// Text is an element with letters of its own (not only spaces), so the gaps between the title's words don't count
const hasText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());

document.addEventListener("mousemove", (event) => {
  cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  const card = event.target.closest("[data-cursor]");
  showWord(card);
  // Over a link (that isn't a card, where it grows) the circle grows a little;
  // over a link or the site's text it turns into the negative of what's under it
  const link = card === null && event.target.closest("a") !== null;
  cursor.classList.toggle("is-small", link);
  cursor.classList.toggle("is-negative", link || (card === null && hasText(event.target)));
  cursor.classList.add("is-visible");
});

// Hide the circle when the mouse leaves the browser window
document.documentElement.addEventListener("mouseleave", () => {
  cursor.classList.remove("is-visible");
});

// ===== Roll =====
// Splits a word into letters, numbered so each one starts a bit later.
// Letters in their own boxes lose the font's kerning; with keepKerning each letter is nudged
// back to where it sat in the whole word (it matters at the footer's huge size)
function splitLetters(word, text = word.textContent, keepKerning = false) {
  word.textContent = text;
  const kerned = [];
  if (keepKerning) {
    const range = document.createRange();
    [...text].forEach((char, index) => {
      range.setStart(word.firstChild, index);
      range.setEnd(word.firstChild, index + 1);
      kerned.push(range.getBoundingClientRect().left);
    });
  }
  word.textContent = "";
  const letters = [...text].map((char, index) => {
    const letter = document.createElement("span");
    letter.className = "roll__letter";
    letter.style.setProperty("--i", index);
    letter.textContent = char;
    return letter;
  });
  word.append(...letters);
  if (keepKerning) {
    const boxed = letters.map((letter) => letter.offsetLeft);
    letters.forEach((letter, index) => {
      if (index) letter.style.marginLeft = `${kerned[index] - kerned[index - 1] - (boxed[index] - boxed[index - 1])}px`;
    });
  }
}
document.querySelectorAll(".roll > span").forEach((word) => splitLetters(word));

// The footer's "Let's Collab" rolls into the word of the link under it that's hovered (or focused).
// Each word is its own layer (styles.css, .footer__word): the new one rises in from below while the
// one showing rolls out the top from wherever it is, even mid-roll, then is thrown away.
// Between two links (over the " / ") it waits a moment before rolling back to "Let's Collab".
const collab = document.querySelector(".footer__collab");
if (collab) {
  let current = collab.firstElementChild;
  const restingText = current.textContent;
  let showing = restingText;
  let leaving = null;

  splitLetters(current, restingText, true);
  // Again once the font is in, so the kerning is the real one (unless a roll already started)
  document.fonts.ready.then(() => {
    if (showing === restingText && current === collab.firstElementChild) splitLetters(current, restingText, true);
  });

  function rollTo(text) {
    if (text === showing) return;
    showing = text;
    const old = current;
    old.classList.add("is-out");
    setTimeout(() => old.remove(), 1200); // well after its last letter has left
    current = document.createElement("span");
    current.className = "footer__word is-below";
    current.setAttribute("aria-hidden", "true");
    collab.append(current);
    splitLetters(current, text, true);
    current.offsetWidth; // start below, then rise
    current.classList.remove("is-below");
  }

  document.querySelectorAll(".footer__bottom [data-collab]").forEach((link) => {
    const enter = () => {
      clearTimeout(leaving);
      rollTo(link.dataset.collab);
    };
    const leave = () => {
      clearTimeout(leaving);
      leaving = setTimeout(() => rollTo(restingText), 120);
    };
    link.addEventListener("mouseenter", enter);
    link.addEventListener("focus", enter);
    link.addEventListener("mouseleave", leave);
    link.addEventListener("blur", leave);
  });

  // Touch screens: a tapped link keeps its focus, so its word would stay. Coming back to the page
  // (from the app or tab the link opened) rolls back to "Let's Collab", and so does staying here
  // (saying no to opening the app), a couple of seconds after the tap
  if (matchMedia("(hover: none)").matches) {
    const comeBack = () => {
      document.activeElement?.blur();
      clearTimeout(leaving);
      rollTo(restingText);
    };
    collab.parentElement.addEventListener("click", (event) => {
      if (event.target.closest("[data-collab]")) setTimeout(comeBack, 2000);
    });
    addEventListener("pageshow", comeBack);
    addEventListener("focus", comeBack);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) comeBack();
    });
  }
}

// ===== Tapping a link on a touch screen =====
// A link that changes the page opens right away, and its line draws in on the new page
// (styles.css, .is-current). A line drawn here would be caught half-drawn in the page change.
// Links that don't change this page (a placeholder "#", or Instagram in a new tab) draw it on the tap.
if (window.matchMedia("(hover: none)").matches) {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.link-line");
    if (link && (link.getAttribute("href") === "#" || link.target === "_blank")) link.classList.add("is-tapped");
  });

  // Coming back (Back button, or from the Instagram tab) shows the page as it was left: clear the line
  const clearLines = () => document.querySelectorAll(".is-tapped").forEach((link) => link.classList.remove("is-tapped"));
  window.addEventListener("pageshow", clearLines);
  document.addEventListener("visibilitychange", clearLines);
}

// ===== At the footer =====
// Once the footer comes up the top bar fades away, and comes back on the way up
// (styles.css, .is-at-footer; on the project page the title and descriptions go with it)
// (the WIP page has no footer)
const footer = document.querySelector(".footer");
function markFooter() {
  if (!footer) return;
  document.documentElement.classList.toggle("is-at-footer", footer.getBoundingClientRect().top < innerHeight * 0.9);
}
markFooter();
addEventListener("scroll", markFooter, { passive: true });
addEventListener("resize", markFooter);

// ===== Videos that didn't start =====
// iPhone in Low Power Mode won't autoplay and shows a play button instead (hidden in styles.css):
// the first touch anywhere starts them all
const playAll = () => document.querySelectorAll("video[autoplay]").forEach((video) => video.paused && video.play().catch(() => {}));
addEventListener("touchend", playAll, { once: true });
addEventListener("click", playAll, { once: true });
