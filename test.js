// API key and URL for Pixabay
const API_KEY = '38734772-9a4efa24da820dffd50b42987'; // Replace with your actual API key
const PIXABAY_URL = "https://pixabay.com/api/?key=" + API_KEY + "&q=";

// Global variables
let plantInventory = [];
let plantCatalog = [];

// Function to add a new plant
function addPlant() {
    let plantName = document.getElementById('plantName').value;
    let plantType = document.getElementById('plantType').value;
    let plantedDate = document.getElementById('plantedDate').value;
    let soilType = document.getElementById('soilType').value;
    let sunExposure = document.getElementById('sunExposure').value;
    let wateringFrequency = document.getElementById('wateringFrequency').value;
    
    plantName = encrypt(plantName, passphrase);
    plantType = encrypt(plantType, passphrase);
    plantedDate = encrypt(plantedDate, passphrase);
    soilType = encrypt(soilType, passphrase);
    sunExposure = encrypt(sunExposure, passphrase);
    wateringFrequency = encrypt(wateringFrequency, passphrase);
    
    if (plantName && plantType && plantedDate && soilType && sunExposure && wateringFrequency) {
        db.collection('plants').add({
            plantName,
            plantType,
            plantedDate,
            soilType,
            sunExposure,
            wateringFrequency,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log("Plant added successfully");
            document.getElementById('addPlantForm').reset();
            fetchAndPopulatePlants();
        })
        .catch((error) => {
            console.error("Error adding plant: ", error);
        });
    } else {
        alert('Please fill in all fields');
    }
}

// Function to fetch and populate plants
function fetchAndPopulatePlants() {
    db.collection('plants').orderBy('createdAt').get()
    .then((querySnapshot) => {
        plantInventory = [];
        querySnapshot.forEach((doc) => {
            let plantSpecimen = doc.data();
            plantSpecimen.id = doc.id;

            plantSpecimen.plantName = decrypt(plantSpecimen.plantName, passphrase);
            plantSpecimen.plantType = decrypt(plantSpecimen.plantType, passphrase);
            plantSpecimen.plantedDate = decrypt(plantSpecimen.plantedDate, passphrase);
            plantSpecimen.soilType = decrypt(plantSpecimen.soilType, passphrase);
            plantSpecimen.sunExposure = decrypt(plantSpecimen.sunExposure, passphrase);
            plantSpecimen.wateringFrequency = decrypt(plantSpecimen.wateringFrequency, passphrase);
            plantSpecimen.growthDuration = calculateGrowthDuration(plantSpecimen.plantedDate);

            plantInventory.push(plantSpecimen);
        });
        renderPlantList(plantInventory);
        initializeSearchFunctionality();
        compileUniqueSpecies();
    })
    .catch((error) => {
        console.error("Error fetching plants: ", error);
    });
}

// Function to calculate growth duration
function calculateGrowthDuration(plantedDate) {
    const currentDate = new Date();
    const plantingDate = new Date(plantedDate);
    const growthPeriod = Math.abs(currentDate - plantingDate);
    const daysGrown = Math.ceil(growthPeriod / (1000 * 60 * 60 * 24)); 
    return daysGrown;
}

// Function to render plant list
function renderPlantList(plants) {
    const plantList = document.getElementById('plantList');
    plantList.innerHTML = ''; // Clear any existing content
    
    plants.forEach(plant => {
        const plantItem = document.createElement('div');
        plantItem.className = 'plant-item';

        // Fetch images based on the plant name
        fetch(PIXABAY_URL + encodeURIComponent(plant.plantName))
            .then(response => response.json())
            .then(data => {
                let imageUrl = data.hits && data.hits.length > 0 
                    ? data.hits[0].webformatURL 
                    : 'path/to/placeholder-image.jpg'; // Replace with actual placeholder

                plantItem.innerHTML = `
                    <img src="${imageUrl}" alt="${plant.plantName}">
                    <h3>${plant.plantName}</h3>
                    <p>Type: ${plant.plantType}</p>
                    <p>Planted: ${plant.plantedDate} (${plant.growthDuration} days ago)</p>
                    <p>Soil: ${plant.soilType}</p>
                    <p>Sun: ${plant.sunExposure}</p>
                    <p>Watering: ${plant.wateringFrequency}</p>
                    <button onclick="checkPlantHealth('${plant.id}')">Check Health</button>
                `;
            })
            .catch(error => {
                console.error('Error fetching image:', error);
                plantItem.innerHTML = `
                    <p>Error loading image for ${plant.plantName}</p>
                    <h3>${plant.plantName}</h3>
                    <p>Type: ${plant.plantType}</p>
                    <p>Planted: ${plant.plantedDate} (${plant.growthDuration} days ago)</p>
                    <p>Soil: ${plant.soilType}</p>
                    <p>Sun: ${plant.sunExposure}</p>
                    <p>Watering: ${plant.wateringFrequency}</p>
                    <button onclick="checkPlantHealth('${plant.id}')">Check Health</button>
                `;
            });

        plantList.appendChild(plantItem);
    });
}

// Function to check plant health
function checkPlantHealth(plantId) {
    const plant = plantInventory.find(p => p.id === plantId);
    if (!plant) return;

    let health = "Good";
    let recommendations = [];

    if (plant.wateringFrequency === "Low" && plant.growthDuration > 7) {
        health = "Needs attention";
        recommendations.push("Consider increasing watering frequency.");
    }

    if (plant.sunExposure === "Low" && ["Tomato", "Pepper", "Sunflower"].includes(plant.plantName)) {
        health = "Needs attention";
        recommendations.push("This plant may need more sunlight.");
    }

    if (plant.growthDuration > 90) {
        recommendations.push("Consider checking for signs of maturity or harvest readiness.");
    }

    alert(`Plant Health: ${health}\n\nRecommendations:\n${recommendations.join("\n")}`);
}

// Function to initialize search functionality
function initializeSearchFunctionality() {
    const plantSearchInput = document.getElementById('plantSearchBar');
    plantSearchInput.addEventListener('input', function() {
        const queryTerm = this.value.toLowerCase();
        const matchingPlants = plantInventory.filter(plant => 
            plant.plantName.toLowerCase().includes(queryTerm)
        );
        renderPlantList(matchingPlants);
    });
}

// Function to compile unique species
function compileUniqueSpecies() {
    plantCatalog = [...new Set(plantInventory.map(plant => plant.plantName))];
}

// Initial setup
document.addEventListener('DOMContentLoaded', (event) => {
    fetchAndPopulatePlants();
});