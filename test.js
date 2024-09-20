// API key and URL for Pixabay
const API_KEY = '38734772-9a4efa24da820dffd50b42987'; // Replace with your actual API key
const PIXABAY_URL = "https://pixabay.com/api/?key=" + API_KEY + "&q=";


// Global variables
let plantInventory = [];
let plantCatalog = [];
const validPlantNames = [
    'Carrot', 'Broccoli', 'Spinach', 'Tomato', 'Potato',  // Vegetables
    'Cabbage', 'Cucumber', 'Bell Pepper', 'Eggplant', 'Zucchini',
    'Onion', 'Garlic', 'Pumpkin', 'Lettuce', 'Cauliflower',
    
    'Apple', 'Banana', 'Mango', 'Grapes', 'Strawberry',  // Fruits
    'Orange', 'Pineapple', 'Papaya', 'Pear', 'Peach',
    'Watermelon', 'Blueberry', 'Raspberry', 'Cherry', 'Kiwi',

    'Basil', 'Mint', 'Thyme', 'Oregano', 'Parsley',  // Herbs
    'Cilantro', 'Sage', 'Rosemary', 'Dill', 'Lemongrass',
    'Chives', 'Tarragon', 'Fennel', 'Bay Leaf', 'Chamomile',

    'Wheat', 'Rice', 'Barley', 'Quinoa', 'Sorghum',  // Grains
    'Oats', 'Corn', 'Rye', 'Buckwheat', 'Teff',

    'Millet', 'Foxtail Millet', 'Finger Millet', 'Pearl Millet', 'Barnyard Millet',  // Millets
    'Proso Millet', 'Kodo Millet', 'Little Millet',

    'Rose', 'Tulip', 'Daisy', 'Sunflower', 'Lily',  // Flowers
    'Orchid', 'Marigold', 'Lavender', 'Jasmine', 'Chrysanthemum',
    'Daffodil', 'Peony', 'Iris', 'Begonia',

    'Oak', 'Maple', 'Pine', 'Birch', 'Cedar',  // Trees
    'Eucalyptus', 'Banyan', 'Baobab', 'Palm', 'Cherry Blossom',

    'Azalea', 'Hibiscus', 'Hydrangea', 'Lilac', 'Boxwood',  // Shrubs
    'Forsythia', 'Camellia', 'Rhododendron', 'Holly', 'Juniper',

    'Saguaro', 'Prickly Pear', 'Barrel Cactus', 'Christmas Cactus', 'Golden Barrel',  // Cacti
    'Cholla', 'Pincushion Cactus', 'Bishop’s Cap', 'Organ Pipe Cactus'
];



//sentance 
function toSentenceCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function levenshte_in_Distance(a, b) {
    const matrix = [];

    // Create an empty matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function findClosestMatch(inputName, validNames) {
    let closestMatch = null;
    let lowestDistance = Infinity;

    validNames.forEach(validName => {
        const distance = levenshte_in_Distance(inputName.toLowerCase(), validName.toLowerCase());
        if (distance < lowestDistance) {
            lowestDistance = distance;
            closestMatch = validName;
        }
    });

    return closestMatch;
}

// Usage in addPlant function

// Function to add a new plant
function addPlant() {
    let plantName = document.getElementById('plantName').value.trim();
    let plantType = document.getElementById('plantType').value.trim();
    let plantedDate = document.getElementById('plantedDate').value.trim();
    let soilType = document.getElementById('soilType').value.trim();
    let sunExposure = document.getElementById('sunExposure').value.trim();
    let wateringFrequency = document.getElementById('wateringFrequency').value.trim();

    // Check for empty inputs
    if (!plantName || !plantType || !plantedDate || !soilType || !sunExposure || !wateringFrequency) {
        alert('Please fill in all fields');
        return; // Exit the function if any field is empty
    }

    plantName = findClosestMatch(plantName, validPlantNames);

    // Convert plant name to sentence case
    plantName = toSentenceCase(plantName);

    // Encrypt the input values
    plantName = encrypt(plantName, passphrase);
    plantType = encrypt(plantType, passphrase);
    plantedDate = encrypt(plantedDate, passphrase);
    soilType = encrypt(soilType, passphrase);
    sunExposure = encrypt(sunExposure, passphrase);
    wateringFrequency = encrypt(wateringFrequency, passphrase);

    // Add the plant data to the Firestore database
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