const button = document.getElementById("search-button");
const cityname = document.getElementById("search-input");

const cityNameDisplay = document.getElementById("city-name");
const cityTimeDisplay = document.getElementById("city-time");
const cityTempDisplay = document.getElementById("city-temp");
const cityHumidityDisplay = document.getElementById("city-humidity");
const cityPrecipitationDisplay = document.getElementById("city-precipitation");
const cityWindSpeedDisplay = document.getElementById("city-wind-speed");
const pestRiskDisplay = document.getElementById("pest-risk");
const fungiRiskDisplay = document.getElementById("fungi-risk");

async function getdata(city) {
    try {
        const response = await fetch(
            `http://api.weatherapi.com/v1/current.json?key=2f1e931e52a1439d997143429241509&q=${city}&aqi=yes`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function calculateRisk(temperature, humidity, precipitation, windSpeed) {
    // Simple risk calculation for pests
    let pestRisk = "Low";
    let fungiRisk = "Low";

    // Pest risk: High temperature, moderate humidity, low wind
    if (temperature > 20 && humidity > 50 && windSpeed < 10) {
        pestRisk = "High";
    } else if (temperature > 15 && humidity > 40 && windSpeed < 15) {
        pestRisk = "Moderate";
    }

    // Fungi risk: High humidity and rain
    if (humidity > 70 && precipitation > 0) {
        fungiRisk = "High";
    } else if (humidity > 60 && precipitation > 0) {
        fungiRisk = "Moderate";
    }

    return { pestRisk, fungiRisk };
}

button.addEventListener("click", async () => {
    if (cityname) {
        const searchValue = cityname.value.trim();
        if (searchValue) {
            const result = await getdata(searchValue);
            if (result) {
                // Get the weather data
                const temperature = result.current.temp_c;
                const humidity = result.current.humidity;
                const precipitation = result.current.precip_mm;
                const windSpeed = result.current.wind_kph;

                // Populate the weather data fields
                cityNameDisplay.textContent = result.location.name;
                cityTimeDisplay.textContent = `Local Time: ${result.location.localtime}`;
                cityTempDisplay.textContent = `Temperature: ${temperature} °C`;
                cityHumidityDisplay.textContent = `Humidity: ${humidity} %`;
                cityPrecipitationDisplay.textContent = `Precipitation: ${precipitation} mm`;
                cityWindSpeedDisplay.textContent = `Wind Speed: ${windSpeed} kph`;

                // Calculate pest and fungi risk
                const { pestRisk, fungiRisk } = calculateRisk(temperature, humidity, precipitation, windSpeed);

                // Display risk levels
                pestRiskDisplay.textContent = `Pest Risk: ${pestRisk}`;
                fungiRiskDisplay.textContent = `Fungi Risk: ${fungiRisk}`;
            } else {
                console.error("Failed to get valid weather data");
            }
        } else {
            console.error("Please enter a city name");
        }
    } else {
        console.error("Search input element not found");
    }
});
