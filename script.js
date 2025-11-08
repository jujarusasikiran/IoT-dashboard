const ctx = document.getElementById("weatherChart").getContext("2d");
const trendCtx = document.getElementById("trendChart").getContext("2d");
const statusDiv = document.getElementById("status");
const valuesDiv = document.getElementById("values");
const citySelect = document.getElementById("citySelect");
const refreshBtn = document.getElementById("refreshBtn");

let weatherChart = null;
let trendChart = null;

const AUTO_REFRESH_MS = 60000; // auto refresh every 1 minute
let autoRefreshTimer = null;
let trendData = []; // stores last 10 readings

// Utility for formatting numbers
function fmt(v, unit = "") {
  return v === null || v === undefined ? "N/A" : `${v.toFixed(1)} ${unit}`;
}

// Display current weather values
function showNumericValues(data) {
  const html = `
    <div class="val">🌡 Temp<br><span>${fmt(data.temp, "°C")}</span></div>
    <div class="val">💧 Humidity<br><span>${fmt(data.humidity, "%")}</span></div>
    <div class="val">🌬 Wind<br><span>${fmt(data.wind, "m/s")}</span></div>
    <div class="val">🧭 Pressure<br><span>${fmt(data.pressure, "hPa")}</span></div>
  `;
  valuesDiv.innerHTML = html;
}

// Draw the bar chart
function drawBarChart(city, data) {
  const labels = ["Temperature (°C)", "Humidity (%)", "Wind (m/s)", "Pressure (hPa)"];
  const values = [data.temp, data.humidity, data.wind, data.pressure];

  if (weatherChart) weatherChart.destroy();
  weatherChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: `Weather Data in ${city}`,
          data: values,
          backgroundColor: ["#00bcd4", "#4caf50", "#ff9800", "#9c27b0"],
          borderRadius: 8,
          barThickness: 45,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.1)" },
        },
        x: {
          grid: { color: "rgba(0,0,0,0)" },
        },
      },
    },
  });
}

// Draw the temperature trend line chart
function drawTrendChart(city) {
  const times = trendData.map((t) => t.time);
  const temps = trendData.map((t) => t.temp);

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: times,
      datasets: [
        {
          label: `Temperature Trend in ${city}`,
          data: temps,
          borderColor: "#00e0ff",
          backgroundColor: "rgba(0, 224, 255, 0.15)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#00e0ff",
          pointBorderColor: "#fff",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: "Temperature (°C)" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        x: {
          title: { display: true, text: "Time" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      plugins: {
        legend: {
          labels: { color: "#00e0ff" },
        },
      },
    },
  });
}

// Fetch weather data from backend
async function fetchWeatherData(city, manual = false) {
  try {
    statusDiv.innerText = manual
      ? `🔄 Refreshing data for ${city}...`
      : `Fetching data for ${city}... (auto refresh every 60s)`;

    const url = `http://localhost:5000/api/weather?city=${encodeURIComponent(city)}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Display numeric data and bar chart
    showNumericValues(data);
    drawBarChart(city, data);

    // 🔥 Maintain last 10 readings in trendData
    const now = new Date().toLocaleTimeString();
    trendData.push({ time: now, temp: data.temp });
    if (trendData.length > 10) trendData.shift();

    drawTrendChart(city);

    const timeStr = new Date().toLocaleString();
    statusDiv.innerHTML = `✅ Last updated: ${timeStr} | Auto-refresh every 60s`;
  } catch (err) {
    console.error("Fetch error:", err);
    statusDiv.innerText = `Error: ${err.message}`;
    valuesDiv.innerHTML = "";
  }
}

// Reset auto-refresh
function resetAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    fetchWeatherData(citySelect.value);
  }, AUTO_REFRESH_MS);
}

// Event listeners
citySelect.addEventListener("change", () => {
  trendData = []; // reset trend for new city
  fetchWeatherData(citySelect.value);
  resetAutoRefresh();
});

refreshBtn.addEventListener("click", () => {
  fetchWeatherData(citySelect.value, true);
});

// Initial load
fetchWeatherData(citySelect.value || "Delhi");
resetAutoRefresh();
