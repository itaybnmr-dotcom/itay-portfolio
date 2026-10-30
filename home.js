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
