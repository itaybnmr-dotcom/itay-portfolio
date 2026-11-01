// ===== Where you are, right now =====
// The top right corner shows the visitor's own date, time and time zone,
// their city's coordinates (found from their internet address, no permission pop-up)
// and the temperature there. If any of it can't be found, it falls back to Tel Aviv.
const TEL_AVIV = { latitude: 32.08088, longitude: 34.78057 };
const here = (name) => document.querySelector(`[data-here="${name}"]`);

// "Fri, 30.10", "18:04" and "GMT+2" from the visitor's clock
function showTime() {
  const now = new Date();
  const two = (n) => String(n).padStart(2, "0");
  const day = now.toLocaleDateString("en-GB", { weekday: "short" });
  here("date").textContent = `${day}, ${two(now.getDate())}.${two(now.getMonth() + 1)}`;
  // The colon blinks (styles.css); rewritten only when the minute changes, so the blink doesn't restart
  const time = `${two(now.getHours())}<span class="hero__colon">:</span>${two(now.getMinutes())}`;
  if (here("time").innerHTML !== time) here("time").innerHTML = time;
  const offset = -now.getTimezoneOffset(); // in minutes, east of Greenwich is positive
  const hours = Math.trunc(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  here("zone").textContent = `GMT${offset < 0 ? "-" : "+"}${hours}${minutes ? ":" + two(minutes) : ""}`;
}
showTime();
setInterval(showTime, 1000);

// "32.08088° N, 34.78057° E", then the temperature at that spot
function showPlace({ latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  here("place").textContent =
    `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(5)}° ${lon < 0 ? "W" : "E"}`;
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
    .then((response) => response.json())
    .then((weather) => (here("temp").textContent = `${Math.round(weather.current.temperature_2m)}℃`))
    .catch(() => {}); // no weather, the spot just stays empty
}

fetch("https://get.geojs.io/v1/ip/geo.json")
  .then((response) => response.json())
  .then((place) => (place.latitude ? place : TEL_AVIV))
  .catch(() => TEL_AVIV)
  .then(showPlace);

// ===== The top bar follows the scroll =====
// Once the works reach the middle of the screen the name rolls into "Works" and keeps its line;
// at the footer (the bio) "Contact" gets the line instead (styles.css, .is-active)
const topName = document.querySelector(".top-bar__name");
const contactLink = document.querySelector('.top-bar__links a[href="#contact"]');
const reached = (selector) => document.querySelector(selector).getBoundingClientRect().top < innerHeight / 2;

// Phones get no scroll effects: the bar just stays as it is there
const phoneLayout = matchMedia("(max-width: 700px)");

function markSection() {
  if (phoneLayout.matches) {
    topName.classList.remove("is-active");
    contactLink.classList.remove("is-active");
    return;
  }
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 1;
  const inFooter = reached(".footer") || atBottom;
  topName.classList.toggle("is-active", reached(".work") && !inFooter);
  contactLink.classList.toggle("is-active", inFooter);
}
markSection();
addEventListener("scroll", markSection, { passive: true });
addEventListener("resize", markSection);

// ===== Intro =====
// Black, then "Hi,", a pause, "I'm", and the name word by word;
// then the rest of the headline all at once; then everything else writes itself in.
// Each word rises in from just below its own spot (styles.css, "Intro").
// The headline is always split into words, so the intro only has to switch the animation on.
const statement = document.querySelector(".hero__statement");
statement.setAttribute("aria-label", statement.textContent.replace(/\s+/g, " ").trim());
const START = 600; // ms of black first
// When each of "Hi, I'm Itay Ben Mayor," comes in, in ms:
// "Hi,", a pause, "I'm", then the name right after it (ignoring the gap between them), one word after another
const BEATS = [0, 800, 950, 1100, 1250];
let wordCount = 0;

statement.querySelectorAll(".hero__line > span").forEach((part) => {
  const firstLine = part.parentElement === statement.firstElementChild;
  const words = part.textContent.split(/( +)/);
  part.textContent = "";
  words.forEach((word) => {
    if (!word.trim()) return part.append(word); // the spaces stay plain text
    const delay = firstLine ? START + BEATS[wordCount++] : null;
    const mask = document.createElement("span");
    mask.className = "intro__word";
    mask.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.setProperty("--d", delay === null ? "var(--rest)" : `${delay}ms`);
    mask.append(inner);
    part.append(mask);
  });
});
statement.classList.add("is-split");

// Phones: the drawn headline's words take the same moments, in order ("Hi," "I'm" "Itay" "Ben" "Mayor,"
// on their beats, the rest with the rest of the headline)
document.querySelectorAll(".hero__phone-statement path").forEach((word, index) => {
  word.style.setProperty("--d", index < BEATS.length ? `${START + BEATS[index]}ms` : "var(--rest)");
});


// The note under the headline types itself in like code: one character after another,
// each one flashing as a block first (styles.css, .intro__key). It starts with everything else.
const TYPE_GAP = 25; // ms between characters
let typed = 0;
function typeOut(element) {
  [...element.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return typeOut(node);
    const letters = [...node.textContent].map((char) => {
      const letter = document.createElement("span");
      letter.className = "intro__key";
      letter.textContent = char;
      letter.style.setProperty("--k", typed++);
      return letter;
    });
    node.replaceWith(...letters);
  });
}
if (document.documentElement.classList.contains("intro")) typeOut(document.querySelector(".hero__note"));

if (document.documentElement.classList.contains("intro")) {
  const restStart = START + BEATS[BEATS.length - 1] + 900;
  document.documentElement.style.setProperty("--rest", `${restStart}ms`);
  document.documentElement.style.setProperty("--type-gap", `${TYPE_GAP}ms`);
  document.fonts.ready.then(() => {
    document.documentElement.classList.add("intro-go");
    // After the last thing has written itself in, the page goes back to normal
    const last = Math.max(3 * 150 + 1200, typed * TYPE_GAP + 150);
    setTimeout(() => document.documentElement.classList.remove("intro", "intro-go"), restStart + 900 + last);
  });
}

// ===== The card's sticker (touch screens) =====
// Its text is split into letters, so they can write themselves in one after another once the
// circle has popped in; that happens when the card comes into view (styles.css, .work__sticker)
const sticker = document.querySelector(".work__sticker");
if (sticker && matchMedia("(hover: none)").matches) {
  const path = sticker.querySelector("textPath");
  const letters = [...path.textContent].map((char, index) => {
    const letter = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    letter.textContent = char;
    letter.style.setProperty("--i", index);
    return letter;
  });
  path.replaceChildren(...letters);
  sticker.classList.add("is-ready");
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    sticker.classList.add("is-in");
    observer.disconnect();
  }, { threshold: 0.5 }).observe(sticker.parentElement);
}
