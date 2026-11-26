// ===== A reload starts a new visit =====
// The About page plays its opening only the first time it's reached in a visit (about.html remembers it);
// reloading any other page starts over, like the home page's opening on a reload
// (the About page handles its own reload, since it remembers the visit before this runs)
if (performance.getEntriesByType("navigation")[0]?.type === "reload" && !document.querySelector(".about-story")) {
  try {
    sessionStorage.removeItem("about-seen");
  } catch (error) {} // storage blocked: nothing was remembered anyway
}

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
  // A hidden circle (the cursor on a phone) measures 0: the ring would fit endless words and crash Safari
  if (!(wordWidth > 0)) return;
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
      // home.js takes data-cursor off the old rows on phones, so a sticker may have no word left: skip it
      const word = textPath.closest("[data-cursor]")?.dataset.cursor;
      if (word) writeRing(textPath, word);
    });
  });
}

// Over anything with data-cursor (the work cards) the circle grows, takes the card's colors
// (--circle and --circle-ink in styles.css) and its word goes around inside it
// It follows the card, not the word: every work says "More info", so going straight from one work
// to the next still changes the colors, right away. The ring is only rewritten when the word changes
let cursorCard = null;
let cursorWord = null;
function showWord(card) {
  if (card === cursorCard) return;
  cursorCard = card;
  cursor.classList.toggle("is-big", card !== null);
  if (card === null) return;
  const colors = getComputedStyle(card);
  cursor.style.setProperty("--circle", colors.getPropertyValue("--circle"));
  cursor.style.setProperty("--circle-ink", colors.getPropertyValue("--circle-ink"));
  const word = card.dataset.cursor;
  if (word === cursorWord && cursor.querySelector(".cursor__ring")) return;
  cursorWord = word;
  cursor.innerHTML = `<svg class="cursor__ring" viewBox="0 0 120 120">
    <path id="cursor-ring" d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0" fill="none"/>
    <text><textPath href="#cursor-ring"></textPath></text>
  </svg>`;
  writeRing(cursor.querySelector("textPath"), word);
}

// Text is an element with letters of its own (not only spaces), so the gaps between the title's words don't count
const hasText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());

// Only with a real mouse. A tap on a phone also sends a mousemove; over a card it wrote the name around
// the circle, which is hidden on phones, and measuring text in a hidden circle crashed iPhone Safari
if (matchMedia("(hover: hover)").matches) document.addEventListener("mousemove", (event) => {
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

// A roll anchored on the right (its two words end at the same spot): the longer word's last letters sit over
// the shorter word, so each one rolls with the letter under it and the two never cross; its letters
// past the shorter word follow one after another, outwards. (Anchored on the left they already line up)
function alignRollEnds(roll) {
  const [from, to] = [...roll.children].map((word) => [...word.querySelectorAll(".roll__letter")]);
  const [longer, shorter] = from.length >= to.length ? [from, to] : [to, from];
  const over = longer.length - shorter.length;
  longer.forEach((letter, index) => letter.style.setProperty("--i", Math.abs(index - over)));
}
document.querySelectorAll(".project__next").forEach(alignRollEnds);

// The footer's "Email" rolls into the address, like the name into "Home"; a click copies it instead of opening
// the mail app, and the cursor's circle grows into a black rectangle with "Copied!" (rolling in like a .roll)
// until the mouse leaves the link
const email = document.querySelector('.footer a[href^="mailto:"]');
const address = email?.href.slice("mailto:".length);
// Copies text; a page on plain http (the local server, opened on a phone) has no clipboard API, and a page
// opened as a file can have it refuse, so the old way there
function copyText(text) {
  const modern = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject();
  return modern.catch(() => copyTheOldWay(text));
}
function copyTheOldWay(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, text.length); // iPhone
  const copied = document.execCommand("copy");
  field.remove();
  return copied ? Promise.resolve() : Promise.reject();
}
if (email && matchMedia("(hover: hover)").matches) {
  email.classList.replace("link-line", "roll");
  email.classList.add("footer__email");
  email.innerHTML = `<span class="roll__from">${email.textContent}</span><span class="roll__to link-line" aria-hidden="true">${address}</span>`;
  email.querySelectorAll("span").forEach((word) => splitLetters(word));
  alignRollEnds(email);
}
let posterInfo = document.querySelector(".poster-info");
if (!posterInfo && email) {
  posterInfo = document.createElement("div");
  posterInfo.className = "poster-info";
  posterInfo.setAttribute("aria-hidden", "true");
  posterInfo.append(document.createElement("p"));
}
if (posterInfo && matchMedia("(hover: hover)").matches) {
  cursor.append(posterInfo);
  const line = posterInfo.firstElementChild;
  let shownInfo = null;
  let shownLength = 0;
  function rollLine(text) {
    line.querySelectorAll(".poster-info__word:not(.is-leaving)").forEach((old) => {
      old.classList.add("is-leaving");
      setTimeout(() => old.remove(), 1500);
    });
    if (!text) return;
    const word = document.createElement("span");
    word.className = "poster-info__word";
    splitLetters(word, text);
    line.append(word);
    // The rectangle stretches or shrinks to the new line (measured in its letters, which sit a hair wider
    // than plain text), as long as the roll takes: 0.5s plus 25ms a letter (styles.css, .roll__letter)
    const letters = Math.max(text.length, shownLength);
    shownLength = text.length;
    cursor.style.setProperty("--info-roll", `${0.5 + letters * 0.025}s`);
    cursor.style.width = `${word.offsetWidth + 2 * parseFloat(getComputedStyle(posterInfo).paddingLeft)}px`;
    requestAnimationFrame(() => requestAnimationFrame(() => word.classList.add("is-in")));
  }
  email?.addEventListener("click", (event) => {
    event.preventDefault();
    copyText(address).then(() => {
      // It stays until the mouse leaves the link (the closing below)
      email.dataset.info = shownInfo = "Copied!";
      cursor.classList.add("is-info");
      rollLine(shownInfo);
      cursor.style.height = `${line.offsetHeight + 2 * parseFloat(getComputedStyle(posterInfo).paddingLeft)}px`;
    });
  });
  // Off the link it closes
  addEventListener("pointermove", (event) => {
    if (shownInfo === null || event.target.closest?.("[data-info]")) return;
    shownInfo = null;
    if (email) delete email.dataset.info;
    rollLine("");
    shownLength = 0;
    cursor.classList.remove("is-info");
    cursor.style.width = cursor.style.height = "";
  }, { passive: true });
}

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
    // "Email" copies the address instead of opening the mail app, and "Let's Collab" rolls into "Copied!"
    // (like the computer's cursor), then back with the rest
    email?.addEventListener("click", (event) => {
      event.preventDefault();
      copyText(address).then(() => {
        clearTimeout(leaving);
        rollTo("Copied!");
      }, () => { location.href = email.href; }); // no copying here: open the mail app after all
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
  // Only once the page has been scrolled: on a short page (About) the footer already shows at the top,
  // and the top bar must stay there
  document.documentElement.classList.toggle("is-at-footer", scrollY > 0 && footer.getBoundingClientRect().top < innerHeight * 0.9);
}
markFooter();
addEventListener("scroll", markFooter, { passive: true });
addEventListener("resize", markFooter);

// ===== Project pages: the text fades into the pictures =====
// The texts stay put while the work scrolls under them; over a picture they'd be lost,
// so each one fades out (the project's title stays, above everything) while a picture, a video or a board is under it (styles.css, .is-over-media)
const words = document.querySelectorAll(".project-page :is(.project__about, .project__course, .project__text)");
const media = document.querySelectorAll(".project-page main :is(img, video, .project__board)");
function markMedia() {
  const boxes = [...media].map((item) => item.getBoundingClientRect()).filter((box) => box.width);
  words.forEach((word) => {
    const text = word.getBoundingClientRect();
    word.classList.toggle("is-over-media", boxes.some((box) =>
      box.top < text.bottom && box.bottom > text.top && box.left < text.right && box.right > text.left));
  });
}
if (words.length && media.length) {
  markMedia();
  addEventListener("scroll", markMedia, { passive: true });
  addEventListener("resize", markMedia);
}

// ===== Only the videos near the screen load and play =====
// The videos aren't autoplay (data-play, preload="none"): each loads and starts half a screen before
// it scrolls in and pauses once it's out, instead of all of them loading at once (the Record Day page has seven)
// A card's videos are watched through the card: the home intro masks the card's inside (clip-path),
// and a masked video counts as off screen, even once the mask is gone
// Phones get the lighter copies (<source media>, "-phone.mp4"). A video picks its source when the page reaches it,
// which can be before the phone's width is known: one that picked the wrong one picks again as it comes near,
// not before (load() makes Safari fetch it at once, whatever its preload says)
function pickSource(video) {
  const right = [...video.querySelectorAll("source")].find((source) => !source.media || matchMedia(source.media).matches);
  if (right && video.currentSrc !== right.src) video.load();
}
const nearScreen = new Set();
let glide; // the Tab glide running now, if any (glideTo, below)
const videoWatcher = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
  const videos = target.matches("video") ? [target] : target.querySelectorAll("video[data-play]");
  videos.forEach((video) => {
    if (isIntersecting) {
      nearScreen.add(video);
      pickSource(video);
      if (!glide) video.play().catch(() => {}); // mid-glide: it starts once the page stops (glideTo)
    } else {
      nearScreen.delete(video);
      video.pause();
    }
  });
}), { rootMargin: "50% 0px" });
new Set([...document.querySelectorAll("video[data-play]")].map((video) => video.closest(".work") ?? video))
  .forEach((target) => videoWatcher.observe(target));

// ===== Videos that didn't start =====
// iPhone in Low Power Mode won't autoplay and shows a play button instead (hidden in styles.css):
// the first touch anywhere starts the ones on screen
const playAll = () => nearScreen.forEach((video) => video.paused && video.play().catch(() => {}));
addEventListener("touchend", playAll, { once: true });
addEventListener("click", playAll, { once: true });

// The trips Tab makes (top to bottom and back, and to a link off screen) and the links to a spot on the page glide
// as a CSS transition (styles.css, .glide-layer): the page jumps to where it's going at once, the parts that
// scroll are put back where they were, and they slide into place on the site's ease, over --glide-duration.
// The browser moves them on its own, frame by frame, so nothing on the page can make the glide stutter.
// The parts that stay put on the screen (the top bar, the cursor, a project's title) aren't moved.
function glideLayers(parent, fixed) {
  return [...parent.children].flatMap((el) => {
    if (fixed.includes(el) || el.matches("script, style")) return [];
    const style = getComputedStyle(el);
    // Something fixed inside, or a transform of its own (that the glide's would replace): its children move instead
    if (fixed.some((f) => el.contains(f)) || style.transform !== "none") return glideLayers(el, fixed);
    return style.display === "none" ? [] : [el];
  });
}

function glideTo(top) {
  glide?.cancel();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = scrollY;
  const to = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
  if (reduce || Math.abs(to - from) < 1) return scrollTo({ top: to, behavior: "instant" });
  const fixed = [...document.querySelectorAll("body *")].filter((el) => getComputedStyle(el).position === "fixed");
  const layers = glideLayers(document.body, fixed);
  nearScreen.forEach((video) => video.pause()); // playing video while the page flies by drops frames; they start again when it stops
  scrollTo({ top: to, behavior: "instant" });
  layers.forEach((el) => (el.style.transform = `translateY(${to - from}px)`));
  document.body.offsetHeight; // the browser takes in where they start before they're let go
  layers.forEach((el) => {
    el.classList.add("glide-layer");
    el.style.transform = "";
  });
  const finish = () => {
    if (glide !== current) return;
    layers.forEach((el) => el.classList.remove("glide-layer"));
    glide = null;
    playAll(); // the videos it passed stayed still, so loading them didn't stutter the glide; the ones where it stopped play now
  };
  // Stopped midway (a wheel, a touch, another glide): the page stays where the glide had got to
  const current = {
    cancel() {
      const shift = new DOMMatrix(getComputedStyle(layers[0]).transform).m42;
      layers.forEach((el) => el.classList.remove("glide-layer"));
      scrollTo({ top: to - shift, behavior: "instant" });
      glide = null;
    },
  };
  glide = current;
  // Only the glide's own end counts, not a line finishing under a link somewhere inside
  const onEnd = (event) => {
    if (event.target !== layers[0] || event.propertyName !== "transform") return;
    layers[0].removeEventListener("transitionend", onEnd);
    finish();
  };
  layers[0].addEventListener("transitionend", onEnd);
}

// Links to a spot on the same page ("Contact", "Works") glide there too, instead of the browser's
// smooth scroll, which jumps and stutters over the videos. It lands where the browser would,
// clear of the top bar (scroll-margin-top in styles.css); the footer only shows at the very bottom
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  const target = link && link.getAttribute("href").length > 1 && document.querySelector(link.getAttribute("href"));
  if (!target || event.metaKey || event.ctrlKey || event.shiftKey) return;
  // Phones scroll there themselves: their own smooth scroll (styles.css, scroll-behavior) is smoother than any glide
  if (matchMedia("(hover: none)").matches) return;
  event.preventDefault();
  if (target.closest("footer")) return glideTo(document.documentElement.scrollHeight);
  glideTo(scrollY + target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop));
});

// A wheel or a touch takes the page back from the glide
["wheel", "touchstart"].forEach((type) => addEventListener(type, () => {
  if (!glide) return;
  glide.cancel();
  playAll();
}, { passive: true }));

// Moving with Tab: the page glides to the focused link instead of jumping to it,
// and past the last link it goes back up to the first one (Shift+Tab: the other way round).
// Links the eye can't see (like the hidden name in the top bar on project pages) are skipped.
// The footer sits under the page and only shows at the bottom, so its links glide all the way down.
addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || event.ctrlKey || event.metaKey) return; // Option+Tab too: Safari's own key for moving between links
  const links = [...document.querySelectorAll("a[href], button, [tabindex]:not([tabindex='-1'])")]
    .filter((el) => !el.disabled && el.checkVisibility({ visibilityProperty: true }));
  if (!links.length) return;
  event.preventDefault();
  const back = event.shiftKey;
  const index = links.indexOf(document.activeElement);
  const last = links.length - 1;
  let next;
  if (index === -1) next = back ? links[last] : links[0];
  else next = links[back ? (index === 0 ? last : index - 1) : (index === last ? 0 : index + 1)];
  next.focus({ preventScroll: true });

  if (!back && index === last) glideTo(0);
  else if (next.closest("footer")) glideTo(document.documentElement.scrollHeight);
  else {
    const box = next.getBoundingClientRect();
    if (box.top < 0 || box.bottom > innerHeight) glideTo(scrollY + box.top + box.height / 2 - innerHeight / 2);
  }
});

// ===== The globe (About, under "So yeah that's me...", and the home page, over "More to come soon...") =====
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
const meridians = [...document.querySelectorAll(".globe__meridians path")];

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
  meridians.forEach((meridian, n) => {
    const i = n % GLOBE_ARCS; // each globe has its own six
    const place = (((i + 0.5) / GLOBE_ARCS - slide) % 1 + 1) % 1; // 0 = left edge, 1 = right edge
    meridian.setAttribute("d", meridianPath(place * 2 - 1));
  });
}

drawGlobe(0);
if (meridians.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  requestAnimationFrame(function spin(now) {
    drawGlobe(now / 1000);
    requestAnimationFrame(spin);
  });
}
