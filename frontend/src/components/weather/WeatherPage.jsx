// Weather Page — full-screen animated background with live weather data

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clearGif       from "../../assets/clear sky.gif";
import rainGif        from "../../assets/rain.gif";
import rainLightGif   from "../../assets/rain-light.gif";
import rainThunderGif from "../../assets/rain-thunderstroms.gif";
import sunnyGif       from "../../assets/sunny.gif";
import windGif        from "../../assets/wind.gif";
import "./WeatherPage.css";
import WeatherStats from "./WeatherStats";

// Maps OpenWeatherMap `weather[0].main` → internal theme key
const getWeatherTheme = (weatherMain) => {
  const m = (weatherMain || "").toLowerCase();
  if (m.includes("thunder"))                         return "thunder";
  if (m.includes("rain") || m.includes("drizzle"))   return "rain";
  if (m.includes("snow"))                            return "snow";
  if (m.includes("clear"))                           return "clear";
  if (m.includes("cloud") || m.includes("overcast")) return "clouds";
  if (m.includes("mist") || m.includes("fog") || m.includes("haze")) return "mist";
  return "clear";
};

const GIF_MAP = {
  thunder: rainThunderGif,
  rain:    rainGif,
  snow:    rainLightGif,
  clear:   clearGif,
  clouds:  sunnyGif,
  mist:    windGif,
};
const getBgGif = (theme) => GIF_MAP[theme] || sunnyGif;

const WeatherPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef();
  const [searchCity,    setSearchCity]    = useState("");
  const [coords,        setCoords]        = useState(null);
  const [error,         setError]         = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [myData,        setMyData]        = useState({});
  const [cityDetails,   setCityDetails]   = useState({});
  const [dataWeather,   setDataWeather]   = useState({});
  const [windData,      setWindData]      = useState({});
  const [weatherTheme,  setWeatherTheme]  = useState("clear");
  const [locationLabel, setLocationLabel] = useState("Detecting your location…");
  const [inputText,     setInputText]     = useState("");
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || "2a77301bf0bec9d3ffb404bbd6b83ceb";

  // Geolocation on mount
  useEffect(() => {
    const fallback = async () => {
      try {
        const res  = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data?.city) {
          setSearchCity(data.city);
          setLocationLabel(`${data.city}, ${data.country_name || data.country}`);
        } else {
          setSearchCity("Mumbai"); setLocationLabel("Mumbai, India");
        }
      } catch {
        setSearchCity("Mumbai"); setLocationLabel("Mumbai, India");
      }
    };
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLabel("Your location");
      },
      () => fallback(),
      { timeout: 7000 }
    );
  }, []);

  // Fetch whenever coords or city changes
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true); setError(false);
      try {
        const url = coords
          ? `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&APPID=${API_KEY}&units=metric`
          : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(searchCity)}&APPID=${API_KEY}&units=metric`;

        const response = await fetch(url);
        const data     = await response.json();
        if (response.ok) {
          setCityDetails(data.city);
          setMyData(data.list[0].main);
          setDataWeather(data.list[0].weather[0]);
          setWindData(data.list[0].wind);
          setWeatherTheme(getWeatherTheme(data.list[0].weather[0]?.main));
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (coords || searchCity) fetchWeather();
  }, [coords, searchCity]);

  const handleSearch = () => {
    const city = inputText.trim();
    if (!city) return;
    setCoords(null);
    setSearchCity(city);
    setLocationLabel(city);
    setInputText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };

  const bgGif = getBgGif(weatherTheme);

  return (
    <div className="wx-page">
      {/* Full-screen GIF — key forces remount on src change */}
      <div className="wx-bg" aria-hidden="true">
        <img src={bgGif} alt="" key={bgGif} />
        <div className="wx-bg-overlay" />
      </div>

      {/* Back arrow */}
      <button className="wx-back-btn" onClick={() => navigate("/home")} aria-label="Back to home">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* Glass panel */}
      <div className="wx-glass-panel">

        {/* City name */}
        <div className="wx-city">
          {loading ? (
            <span className="wx-city-name">{locationLabel}</span>
          ) : error ? (
            <span className="wx-error">City not found — try again</span>
          ) : (
            <>
              <span className="wx-city-name">{cityDetails?.name}, {cityDetails?.country}</span>
              <span className="wx-city-sub">Current Weather</span>
            </>
          )}
        </div>

        {/* Search bar */}
        <div className="wx-search-wrap">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search city…"
            aria-label="City name"
          />
          <button className="wx-search-btn" onClick={handleSearch} aria-label="Search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            Search
          </button>
        </div>

        {/* Weather data */}
        <div className="wx-data-area">
          {loading ? (
            <div className="wx-loading">
              <div className="wx-dots"><span/><span/><span/></div>
              <p>Fetching weather…</p>
            </div>
          ) : !error ? (
            <WeatherStats
              weatherData={myData}
              weather={dataWeather}
              city={cityDetails}
              windData={windData}
            />
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default WeatherPage;
