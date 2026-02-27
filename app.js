const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const locationBtn = document.querySelector("#location-btn");
const statusText = document.querySelector("#status-text");
const langButtons = document.querySelectorAll(".lang-btn");

const currentWeather = document.querySelector("#current-weather");
const cityLine = document.querySelector("#city-line");
const currentTemp = document.querySelector("#current-temp");
const currentSummary = document.querySelector("#current-summary");
const feelsLike = document.querySelector("#feels-like");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");

const forecastPanel = document.querySelector("#forecast-panel");
const forecastGrid = document.querySelector("#forecast-grid");

const DEFAULT_CITY = "New York";

const TEXTS = {
  en: {
    eyebrow: "Kawaii Weather Journal",
    subtitle: "Search any city for live weather and a 5-day forecast.",
    cityLabel: "City",
    cityPlaceholder: "Enter a city name",
    searchButton: "Get weather",
    locationButton: "Use my location",
    feelsLike: "Feels like",
    humidity: "Humidity",
    wind: "Wind",
    nextDays: "Next 5 days",
    loadingWeather: "Loading weather...",
    loadingLocation: "Detecting your location...",
    updatedFor: "Updated for {city}.",
    emptyCity: "Please enter a city name.",
    cityNotFound: "City not found. Try another search.",
    cityLoadError: "Could not load city details.",
    weatherLoadError: "Could not load weather data.",
    geoNotSupported: "Geolocation is not supported in this browser.",
    geoDenied: "Location access denied. Enter a city manually.",
    geoDeniedAuto: "Location access denied. Showing {city} instead.",
    geoUnavailable: "Could not get your location. Try again.",
    geoUnavailableAuto: "Could not detect location. Showing {city} instead.",
    yourLocation: "Your location",
    unknownWeather: "Unknown",
    genericError: "Something went wrong. Please retry.",
  },
  de: {
    eyebrow: "Kawaii Wetter Journal",
    subtitle: "Suche eine Stadt fuer Live-Wetter und eine 5-Tage-Vorhersage.",
    cityLabel: "Stadt",
    cityPlaceholder: "Stadt eingeben",
    searchButton: "Wetter abrufen",
    locationButton: "Meinen Standort nutzen",
    feelsLike: "Gefühlt",
    humidity: "Luftfeuchte",
    wind: "Wind",
    nextDays: "Nächste 5 Tage",
    loadingWeather: "Wetter wird geladen...",
    loadingLocation: "Standort wird ermittelt...",
    updatedFor: "Aktualisiert für {city}.",
    emptyCity: "Bitte einen Stadtnamen eingeben.",
    cityNotFound: "Stadt nicht gefunden. Bitte erneut versuchen.",
    cityLoadError: "Stadtdaten konnten nicht geladen werden.",
    weatherLoadError: "Wetterdaten konnten nicht geladen werden.",
    geoNotSupported: "Geolokalisierung wird von diesem Browser nicht unterstützt.",
    geoDenied: "Standortzugriff verweigert. Bitte Stadt manuell eingeben.",
    geoDeniedAuto: "Standortzugriff verweigert. Zeige stattdessen {city}.",
    geoUnavailable: "Standort konnte nicht ermittelt werden. Bitte erneut versuchen.",
    geoUnavailableAuto: "Standort konnte nicht ermittelt werden. Zeige stattdessen {city}.",
    yourLocation: "Dein Standort",
    unknownWeather: "Unbekannt",
    genericError: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
  },
};

const WEATHER_CODES = {
  en: {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    85: "Light snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm with hail",
  },
  de: {
    0: "Klarer Himmel",
    1: "Überwiegend klar",
    2: "Teilweise bewölkt",
    3: "Bedeckt",
    45: "Nebel",
    48: "Reifnebel",
    51: "Leichter Niesel",
    53: "Nieselregen",
    55: "Starker Nieselregen",
    61: "Leichter Regen",
    63: "Regen",
    65: "Starker Regen",
    71: "Leichter Schnee",
    73: "Schnee",
    75: "Starker Schneefall",
    77: "Schneekörner",
    80: "Leichte Regenschauer",
    81: "Regenschauer",
    82: "Heftige Regenschauer",
    85: "Leichte Schneeschauer",
    86: "Schneeschauer",
    95: "Gewitter",
    96: "Gewitter mit Hagel",
    99: "Schweres Gewitter mit Hagel",
  },
};

let currentLang = getInitialLanguage();
let lastCityData = null;
let lastWeatherData = null;

function getInitialLanguage() {
  const browserLang = navigator.language ? navigator.language.toLowerCase() : "en";
  return browserLang.startsWith("de") ? "de" : "en";
}

function t(key, vars = {}) {
  const template = TEXTS[currentLang][key] || TEXTS.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, variable) => vars[variable] ?? "");
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#fca5a5" : "";
}

function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  langButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
  });
}

function getWeatherLabel(code) {
  return WEATHER_CODES[currentLang][code] || WEATHER_CODES.en[code] || t("unknownWeather");
}

function formatNumber(value) {
  return Number.parseFloat(value).toFixed(1);
}

function formatDay(dateStr) {
  const locale = currentLang === "de" ? "de-DE" : "en-US";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCityLine(cityData) {
  const parts = [cityData.name, cityData.admin1, cityData.country].filter(Boolean);
  if (parts.length === 0) {
    return t("yourLocation");
  }
  return parts.join(", ");
}

function isDayPeriod(weatherData) {
  const currentData = weatherData.current || {};
  if (Number.isFinite(currentData.is_day)) {
    return currentData.is_day === 1;
  }

  const daily = weatherData.daily || {};
  if (!daily.sunrise?.[0] || !daily.sunset?.[0] || !currentData.time) {
    return true;
  }

  const currentTime = new Date(currentData.time);
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  return currentTime >= sunrise && currentTime < sunset;
}

function applyDayNightTheme(weatherData) {
  const isDay = isDayPeriod(weatherData);
  document.body.classList.toggle("theme-day", isDay);
  document.body.classList.toggle("theme-night", !isDay);
  return isDay;
}

function normalizeCityData(data = {}) {
  return {
    name: data.name || data.city || "",
    admin1: data.admin1 || data.admin2 || data.admin3 || "",
    country: data.country || data.country_code || "",
  };
}

function normalizeNominatimCityData(data = {}) {
  const address = data.address || {};
  const cityName =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    data.name ||
    "";

  return normalizeCityData({
    name: cityName,
    admin1: address.state || address.region || "",
    country: address.country || "",
  });
}

function normalizeBigDataCityData(data = {}) {
  return normalizeCityData({
    name: data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || "",
    admin1: data.principalSubdivision || "",
    country: data.countryName || data.countryCode || "",
  });
}

async function fetchCity(city, language = currentLang) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", language);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(t("cityLoadError"));
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(t("cityNotFound"));
  }

  return data.results[0];
}

async function fetchCityByCoords(latitude, longitude, language = currentLang) {
  const requestReverse = async (lang) => {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("count", "5");
    url.searchParams.set("language", lang);
    url.searchParams.set("format", "json");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(t("cityLoadError"));
    }

    const data = await response.json();
    return data.results || [];
  };

  const primaryResults = await requestReverse(language);
  const primaryMatch = primaryResults.find((result) => result.name || result.city);
  if (primaryMatch) {
    return normalizeCityData(primaryMatch);
  }

  if (language !== "en") {
    const fallbackResults = await requestReverse("en");
    const fallbackMatch = fallbackResults.find((result) => result.name || result.city);
    if (fallbackMatch) {
      return normalizeCityData(fallbackMatch);
    }
  }

  const nominatimResult = await fetchCityByCoordsNominatim(latitude, longitude, language).catch(
    () => ({ name: "", country: "", admin1: "" })
  );
  if (nominatimResult.name) {
    return nominatimResult;
  }

  if (language !== "en") {
    const nominatimFallback = await fetchCityByCoordsNominatim(latitude, longitude, "en").catch(
      () => ({ name: "", country: "", admin1: "" })
    );
    if (nominatimFallback.name) {
      return nominatimFallback;
    }
  }

  const bigDataResult = await fetchCityByCoordsBigData(latitude, longitude, language).catch(() => ({
    name: "",
    country: "",
    admin1: "",
  }));
  if (bigDataResult.name) {
    return bigDataResult;
  }

  if (language !== "en") {
    const bigDataFallback = await fetchCityByCoordsBigData(latitude, longitude, "en").catch(
      () => ({ name: "", country: "", admin1: "" })
    );
    if (bigDataFallback.name) {
      return bigDataFallback;
    }
  }

  return { name: "", country: "", admin1: "" };
}

async function fetchCityByCoordsNominatim(latitude, longitude, language = currentLang) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("accept-language", language);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(t("cityLoadError"));
  }

  const data = await response.json();
  return normalizeNominatimCityData(data);
}

async function fetchCityByCoordsBigData(latitude, longitude, language = currentLang) {
  const locale = language === "de" ? "de" : "en";
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", locale);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(t("cityLoadError"));
  }

  const data = await response.json();
  return normalizeBigDataCityData(data);
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "6");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(t("weatherLoadError"));
  }
  return response.json();
}

function renderCurrent(cityData, weatherData) {
  const current = weatherData.current;

  cityLine.textContent = formatCityLine(cityData);
  currentTemp.textContent = `${formatNumber(current.temperature_2m)}${weatherData.current_units.temperature_2m}`;
  currentSummary.textContent = getWeatherLabel(current.weather_code);
  feelsLike.textContent = `${formatNumber(current.apparent_temperature)}${weatherData.current_units.apparent_temperature}`;
  humidity.textContent = `${current.relative_humidity_2m}${weatherData.current_units.relative_humidity_2m}`;
  wind.textContent = `${formatNumber(current.wind_speed_10m)} ${weatherData.current_units.wind_speed_10m}`;
  applyDayNightTheme(weatherData);

  currentWeather.classList.remove("hidden");
}

function renderForecast(weatherData) {
  const daily = weatherData.daily;
  forecastGrid.innerHTML = "";

  const dayCount = Math.min(5, daily.time.length - 1);

  for (let i = 1; i <= dayCount; i += 1) {
    const card = document.createElement("article");
    card.className = "day-card";

    const dayName = document.createElement("p");
    dayName.className = "day-name";
    dayName.textContent = formatDay(daily.time[i]);

    const dayCode = document.createElement("p");
    dayCode.className = "day-code";
    dayCode.textContent = getWeatherLabel(daily.weather_code[i]);

    const dayTemp = document.createElement("p");
    dayTemp.className = "day-temp";
    dayTemp.textContent =
      `${formatNumber(daily.temperature_2m_max[i])}${weatherData.daily_units.temperature_2m_max} / ` +
      `${formatNumber(daily.temperature_2m_min[i])}${weatherData.daily_units.temperature_2m_min}`;

    card.append(dayName, dayCode, dayTemp);
    forecastGrid.append(card);
  }

  forecastPanel.classList.remove("hidden");
}

function hideWeatherPanels() {
  currentWeather.classList.add("hidden");
  forecastPanel.classList.add("hidden");
}

function renderAndStore(cityData, weatherData) {
  lastCityData = cityData;
  lastWeatherData = weatherData;

  renderCurrent(cityData, weatherData);
  renderForecast(weatherData);
  setStatus(t("updatedFor", { city: cityData.name || t("yourLocation") }));
}

async function loadWeatherForCity(city) {
  setStatus(t("loadingWeather"));
  hideWeatherPanels();

  try {
    const cityData = await fetchCity(city);
    const weatherData = await fetchWeather(cityData.latitude, cityData.longitude);
    renderAndStore(cityData, weatherData);
  } catch (error) {
    setStatus(error.message || t("genericError"), true);
  }
}

async function loadWeatherForCoordinates(latitude, longitude, autoMode = false) {
  setStatus(t("loadingLocation"));
  hideWeatherPanels();

  try {
    const weatherPromise = fetchWeather(latitude, longitude);
    const cityPromise = fetchCityByCoords(latitude, longitude).catch(() => ({
      name: "",
      country: "",
      admin1: "",
    }));

    const [cityData, weatherData] = await Promise.all([cityPromise, weatherPromise]);
    const normalizedCity = normalizeCityData(cityData);

    renderAndStore(normalizedCity, weatherData);
  } catch (error) {
    const fallbackMessage = t("geoUnavailableAuto", { city: DEFAULT_CITY });
    if (autoMode) {
      setStatus(fallbackMessage, true);
      loadWeatherForCity(DEFAULT_CITY);
      return;
    }
    setStatus(error.message || t("geoUnavailable"), true);
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("UNSUPPORTED_GEOLOCATION"));
      return;
    }

    let bestPosition = null;
    let settled = false;
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    const finishWithPosition = (position) => {
      if (settled) {
        return;
      }
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      resolve(position);
    };

    const finishWithError = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      reject(error);
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= 1200) {
          finishWithPosition(position);
        }
      },
      (error) => {
        if (bestPosition) {
          finishWithPosition(bestPosition);
          return;
        }
        finishWithError(error);
      },
      options
    );

    setTimeout(() => {
      if (settled) {
        return;
      }
      if (bestPosition) {
        finishWithPosition(bestPosition);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => finishWithPosition(position),
        (error) => finishWithError(error),
        options
      );
    }, 9000);
  });
}

async function loadWeatherByLocation(autoMode = false) {
  if (!navigator.geolocation) {
    if (autoMode) {
      setStatus(t("geoNotSupported"), true);
      loadWeatherForCity(DEFAULT_CITY);
      return;
    }
    setStatus(t("geoNotSupported"), true);
    return;
  }

  try {
    setStatus(t("loadingLocation"));
    hideWeatherPanels();
    const position = await getCurrentPosition();
    await loadWeatherForCoordinates(position.coords.latitude, position.coords.longitude, autoMode);
  } catch (error) {
    if (error && error.code === 1) {
      const deniedMessage = autoMode
        ? t("geoDeniedAuto", { city: DEFAULT_CITY })
        : t("geoDenied");
      setStatus(deniedMessage, true);
      if (autoMode) {
        loadWeatherForCity(DEFAULT_CITY);
      }
      return;
    }

    if (autoMode) {
      setStatus(t("geoUnavailableAuto", { city: DEFAULT_CITY }), true);
      loadWeatherForCity(DEFAULT_CITY);
      return;
    }

    setStatus(t("geoUnavailable"), true);
  }
}

function refreshWeatherInSelectedLanguage() {
  if (!lastCityData || !lastWeatherData) {
    return;
  }
  renderCurrent(lastCityData, lastWeatherData);
  renderForecast(lastWeatherData);
  setStatus(t("updatedFor", { city: lastCityData.name || t("yourLocation") }));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus(t("emptyCity"), true);
    return;
  }

  loadWeatherForCity(city);
});

locationBtn.addEventListener("click", () => {
  loadWeatherByLocation(false);
});

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.lang === currentLang) {
      return;
    }
    currentLang = button.dataset.lang;
    applyTranslations();
    refreshWeatherInSelectedLanguage();
  });
});

applyTranslations();
loadWeatherByLocation(true);
