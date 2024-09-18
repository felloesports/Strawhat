
// Initialize Firebase (replace with your own config)
// Plant Health Tracker

var API_KEY = '38734772-9a4efa24da820dffd50b42987'; // Replace with your API key
var URL = "https://pixabay.com/api/?key=" + API_KEY + "&q=";

let plantsArray = [];
let allPlantNames = [];

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
            readPlants();
        })
        .catch((error) => {
            console.error("Error adding plant: ", error);
        });
    } else {
        alert('Please fill in all fields');
    }
}

function readPlants() {
    db.collection('plants').orderBy('createdAt').get()
    .then((querySnapshot) => {
        plantsArray = [];
        querySnapshot.forEach((doc) => {
            let plant = doc.data();
            plant.id = doc.id;

            plant.plantName = decrypt(plant.plantName, passphrase);
            plant.plantType = decrypt(plant.plantType, passphrase);
            plant.plantedDate = decrypt(plant.plantedDate, passphrase);
            plant.soilType = decrypt(plant.soilType, passphrase);
            plant.sunExposure = decrypt(plant.sunExposure, passphrase);
            plant.wateringFrequency = decrypt(plant.wateringFrequency, passphrase);
            plant.daysAfterPlanting = calculateDaysAfterPlanting(plant.plantedDate);

            plant.daysAfterPlanting = calculateDaysAfterPlanting(plant.plantedDate);
            plantsArray.push(plant);
        });
        displayPlants(plantsArray);
        setupSearch();
        initializePlantNames(); // Call this here to ensure it runs after plantsArray is populated
    })
    .catch((error) => {
        console.error("Error reading plants: ", error);
    });
}

function calculateDaysAfterPlanting(plantedDate) {
    const today = new Date();
    const planted = new Date(plantedDate);
    const diffTime = Math.abs(today - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

function displayPlants(plants) {
    const plantList = document.getElementById('plantList');
    plantList.innerHTML = ''; // Clear any existing content
    
    plants.forEach(plant => {
        // Decrypt plant properties
        

        // Create a new plant item element
        const plantItem = document.createElement('div');
        plantItem.className = 'plant-item';

        // Fetch images based on the plant name
        fetch(URL + encodeURIComponent(plant.plantName))
            .then(response => response.json())
            .then(data => {
                let imageUrl;
                
                if (data.hits && data.hits.length > 0) {
                    // Use the first image from the search results
                    imageUrl = data.hits[0].webformatURL;
                } else {
                    // Use a placeholder if no image is found
                    imageUrl = 'path/to/placeholder-image.jpg'; // Replace with an actual placeholder image path
                }

                // Update the innerHTML of the plant item with image and plant details
                plantItem.innerHTML = `
                    <img src="${imageUrl}" alt="${plant.plantName}">
                    <h3>${plant.plantName}</h3>
                    <p>Type: ${plant.plantType}</p>
                    <p>Planted: ${plant.plantedDate} (${plant.daysAfterPlanting} days ago)</p>
                    <p>Soil: ${plant.soilType}</p>
                    <p>Sun: ${plant.sunExposure}</p>
                    <p>Watering: ${plant.wateringFrequency}</p>
                    <button onclick="checkPlantHealth('${plant.id}')">Check Health</button>
                `;
            })
            .catch(error => {
                console.error('Error fetching image:', error);

                // Fallback in case of an error fetching the image
                plantItem.innerHTML = `
                    <p>Error loading image for ${plant.plantName}</p>
                    <h3>${plant.plantName}</h3>
                    <p>Type: ${plant.plantType}</p>
                    <p>Planted: ${plant.plantedDate} (${plant.daysAfterPlanting} days ago)</p>
                    <p>Soil: ${plant.soilType}</p>
                    <p>Sun: ${plant.sunExposure}</p>
                    <p>Watering: ${plant.wateringFrequency}</p>
                    <button onclick="checkPlantHealth('${plant.id}')">Check Health</button>
                `;
            });

        // Append the plant item to the plant list after setting the innerHTML
        plantList.appendChild(plantItem);
    });
}


function checkPlantHealth(plantId) {
    const plant = plantsArray.find(p => p.id === plantId);
    if (!plant) return;

    let health = "Good";
    let recommendations = [];

    if (plant.wateringFrequency === "Low" && plant.daysAfterPlanting > 7) {
        health = "Needs attention";
        recommendations.push("Consider increasing watering frequency.");
    }

    if (plant.sunExposure === "Low" && ["Tomato", "Pepper", "Sunflower"].includes(plant.plantName)) {
        health = "Needs attention";
        recommendations.push("This plant may need more sunlight.");
    }

    if (plant.daysAfterPlanting > 90) {
        recommendations.push("Consider checking for signs of maturity or harvest readiness.");
    }

    alert(`Plant Health: ${health}\n\nRecommendations:\n${recommendations.join("\n")}`);
}

function initializePlantNames() {
    allPlantNames = [...new Set(plantsArray.map(plant => plant.plantName))];
}

function getPlantSuggestions(input) {
    input = input.toLowerCase();
    return allPlantNames.filter(name => 
        name.toLowerCase().includes(input)
    ).sort((a, b) => 
        a.toLowerCase().indexOf(input) - b.toLowerCase().indexOf(input)
    );
}

function updateAutoComplete(suggestions) {
    const searchBar = document.getElementById('searchBar');
    let autoComplete = document.getElementById('autoComplete');
    if (!autoComplete) {
        autoComplete = document.createElement('ul');
        autoComplete.id = 'autoComplete';
        autoComplete.className = 'auto-complete';
        searchBar.parentNode.insertBefore(autoComplete, searchBar.nextSibling);
    }
    autoComplete.innerHTML = '';
    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', () => {
            searchBar.value = suggestion;
            autoComplete.innerHTML = '';
            searchPlants();
        });
        autoComplete.appendChild(li);
    });
}

function searchPlants() {
    const searchBar = document.getElementById('searchBar');
    const searchText = searchBar.value.toLowerCase().trim();
    
    if (searchText === '') {
        displayPlants(plantsArray); // Show all plants if search is empty
        updateAutoComplete([]);
        return;
    }
    
    const suggestions = getPlantSuggestions(searchText);
    updateAutoComplete(suggestions);
    
    const filteredPlants = plantsArray.filter(plant => {
        const plantText = `${plant.plantName} ${plant.plantType} ${plant.soilType} ${plant.sunExposure} ${plant.wateringFrequency}`.toLowerCase();
        return plantText.includes(searchText);
    });
    
    displayPlants(filteredPlants);
}

function setupSearch() {
    const searchBar = document.getElementById('searchBar');
    
    searchBar.addEventListener('input', searchPlants);
    
    searchBar.addEventListener('focus', () => {
        if (searchBar.value) {
            searchPlants();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== searchBar) {
            updateAutoComplete([]);
        }
    });
}

// Make sure to call these functions at the appropriate times
document.addEventListener('DOMContentLoaded', () => {
    readPlants();
    setupSearch();
});