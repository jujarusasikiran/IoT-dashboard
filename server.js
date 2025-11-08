const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Allow access from both localhost (for testing) and deployed frontend (Vercel)
app.use(
  cors({
    origin: [
      "http://localhost:5500",           // VS Code Live Server
      "http://127.0.0.1:5500",
      "https://io-t-dashboard-phi.vercel.app/",    // your deployed frontend domain
    ],
  })
);

// ✅ Use environment variables for security
const API_KEY = process.env.OPENWEATHER_API_KEY || "e5bdd8022442650012dc70f51425f226";

// ✅ Coordinates for Indian cities
const cityCoordinates = {
  Delhi: { lat: 28.6139, lon: 77.209 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Dharmavaram: { lat: 14.4140, lon: 77.7124 },
  Ongole: { lat: 15.5057, lon: 80.0499 },
};

// ✅ Route to fetch live weather data
app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city?.trim();
    const coords = cityCoordinates[city];

    if (!coords) {
      console.warn(`⚠️ Unknown city requested: ${city}`);
      return res.status(400).json({ error: `City '${city}' not found in list` });
    }

    // 🌍 Build OpenWeather API URL
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        console.warn(`⚠️  OpenWeather API key inactive or invalid (status ${response.status})`);
        return res.status(503).json({
          error: "⚠️ OpenWeather API key not yet active or invalid. Please wait a few minutes.",
        });
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const weatherData = {
      city,
      temp: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: data.wind.speed,
      description: data.weather[0].description,
      time: new Date().toLocaleString(),
    };

    console.log("\n-----------------------------------------------------");
    console.log(`🌆 City: ${city}`);
    console.log(`🌡️ Temperature: ${weatherData.temp} °C`);
    console.log(`💧 Humidity: ${weatherData.humidity} %`);
    console.log(`🧭 Pressure: ${weatherData.pressure} hPa`);
    console.log(`🌬️ Wind Speed: ${weatherData.wind} m/s`);
    console.log(`☁️ Condition: ${weatherData.description}`);
    console.log(`🕒 Updated: ${weatherData.time}`);
    console.log("-----------------------------------------------------\n");

    res.json(weatherData);
  } catch (error) {
    console.error("❌ Error fetching weather data:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send(
    "🌦 Smart Weather Monitoring Dashboard Backend is Running...<br>Use /api/weather?city=Delhi"
  );
});

// ✅ Dynamic port for Render/Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
