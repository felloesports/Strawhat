// Plant Health Tracker

var API_KEY = '38734772-9a4efa24da820dffd50b42987'; // Replace with your API key
var URL = "https://pixabay.com/api/?key=" + API_KEY + "&q=";

// Firebase configuration


// Global variables
let plantsArray = [];
let allPlantNames = [];
let imageFetchPromises = [];

// Encryption functions (you need to implement these)
function encrypt(text, passphrase) {
  // Implement your encryption logic here
}

function decrypt(encryptedText, passphrase) {
  // Implement your decryption logic here
}

// Authentication functions
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminuser').value;
  const password = document.getElementById('adminpass').value;
  if(username === "admin" && password === "8742"){
    document.querySelector('.preloader').style.display = 'none';
  } else {
    window.alert("Wrong password");
  }
}

function signOut() {
  firebase.auth().signOut().then(() => {
    console.log('User signed out');
    // Redirect to login page or update UI
  }).catch((error) => {
    console.error('Sign out error', error);
  });
}

// Plant management functions
function addPlant() {
  const plantName = document.getElementById('plantName').value;
  const plantType = document.getElementById('plantType').value;
  const plantedDate = document.getElementById('plantedDate').value;
  const soilType = document.getElementById('soilType').value;
  const sunExposure = document.getElementById('sunExposure').value;
  const wateringFrequency = document.getElementById('wateringFrequency').value;

  if (plantName === '' || plantType === '' || plantedDate === '' || soilType === '' || sunExposure === '' || wateringFrequency === '') {
    alert('Please fill in all fields.');
    return;
  }

  const data = {
    plantName: encrypt(plantName, passphrase),
    plantType: encrypt(plantType, passphrase),
    plantedDate: encrypt(plantedDate, passphrase),
    soilType: encrypt(soilType, passphrase),
    sunExposure: encrypt(sunExposure, passphrase),
    wateringFrequency: encrypt(wateringFrequency, passphrase),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  addData('plants', data);

  // Clear input fields after successful addition
  document.getElementById('plantName').value = '';
  document.getElementById('plantType').value = '';
  document.getElementById('plantedDate').value = '';
  document.getElementById('soilType').value = '';
  document.getElementById('sunExposure').value = '';
  document.getElementById('wateringFrequency').value = '';
}

function addData(collection, data) {
  db.collection(collection).add(data)
    .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      readPlants();
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
}

function readPlants() {
  console.log("Reading plants from Firestore...");
  db.collection('plants').orderBy('createdAt').onSnapshot((querySnapshot) => {
    console.log("Received snapshot from Firestore");
    const newPlantsArray = [];
    querySnapshot.forEach((doc) => {
      console.log("Processing document:", doc.id);
      var plant = doc.data();
      plant.id = doc.id;
      plant.plantName = decrypt(plant.plantName, passphrase);
      plant.plantType = decrypt(plant.plantType, passphrase);
      plant.plantedDate = decrypt(plant.plantedDate, passphrase);
      plant.soilType = decrypt(plant.soilType, passphrase);
      plant.sunExposure = decrypt(plant.sunExposure, passphrase);
      plant.wateringFrequency = decrypt(plant.wateringFrequency, passphrase);
      plant.daysAfterPlanting = calculateDaysAfterPlanting(plant.plantedDate);
      plant.imageUrl = null;
      newPlantsArray.push(plant);
    });
    plantsArray = newPlantsArray;
    console.log('Plants array:', plantsArray);
    displayPlants(plantsArray, true);
    setupSearch();
  }, (error) => {
    console.error("Error in snapshot listener:", error);
  });
}

function calculateDaysAfterPlanting(plantedDate) {
  const today = new Date();
  const planted = new Date(plantedDate);
  const diffTime = Math.abs(today - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

function displayPlants(plants, initialLoad = false) {
  var plantList = document.getElementById('plantList');
  plantList.innerHTML = '';

  if (plants.length === 0) {
    var noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'no-results-message';
    noResultsMessage.textContent = 'No plants found.';
    plantList.appendChild(noResultsMessage);
    return;
  }

  if (initialLoad) {
    imageFetchPromises = [];
  }

  plants.forEach(function(plant) {
    var plantItem = document.createElement('div');
    plantItem.className = 'plant-item';

    var imageElement = document.createElement('img');
    imageElement.className = 'plant-image';

    if (!plant.imageUrl && initialLoad) {
      const promise = $.getJSON(URL + encodeURIComponent(plant.plantName))
        .then(function(data) {
          if (parseInt(data.totalHits) > 0) {
            var randomIndex = Math.floor(Math.random() * data.hits.length);
            var bestImage = data.hits[randomIndex];
            plant.imageUrl = bestImage.webformatURL;
          } else {
            plant.imageUrl = "https://via.placeholder.com/100x200?text=No+Image";
          }
          imageElement.src = plant.imageUrl;
          imageElement.alt = `Image of ${plant.plantName}`;
        });
      imageFetchPromises.push(promise);
    } else {
      imageElement.src = plant.imageUrl || "https://via.placeholder.com/200x200?text=No+Image";
      imageElement.alt = `Image of ${plant.plantName}`;
    }

    var nameElement = document.createElement('div');
    nameElement.className = 'plant-name';
    nameElement.textContent = plant.plantName;

    var typeElement = document.createElement('div');
    typeElement.className = 'plant-type';
    typeElement.textContent = `Type: ${plant.plantType}`;

    var daysElement = document.createElement('div');
    daysElement.className = 'days-after-planting';
    daysElement.textContent = `Days after planting: ${plant.daysAfterPlanting}`;

    var soilElement = document.createElement('div');
    soilElement.className = 'soil-type';
    soilElement.textContent = `Soil: ${plant.soilType}`;

    var sunElement = document.createElement('div');
    sunElement.className = 'sun-exposure';
    sunElement.textContent = `Sun: ${plant.sunExposure}`;

    var wateringElement = document.createElement('div');
    wateringElement.className = 'watering-frequency';
    wateringElement.textContent = `Watering: ${plant.wateringFrequency}`;

    var healthButton = document.createElement('button');
    healthButton.className = 'check-health-button';
    healthButton.textContent = 'Check Health';
    healthButton.onclick = function() {
      checkPlantHealth(plant);
    };

    plantItem.appendChild(imageElement);
    plantItem.appendChild(nameElement);
    plantItem.appendChild(typeElement);
    plantItem.appendChild(daysElement);
    plantItem.appendChild(soilElement);
    plantItem.appendChild(sunElement);
    plantItem.appendChild(wateringElement);
    plantItem.appendChild(healthButton);
    plantList.appendChild(plantItem);
  });

  if (initialLoad) {
    Promise.all(imageFetchPromises).then(() => {
      // Optional: Add any additional logic after images load
    });
  }
}

function checkPlantHealth(plant) {
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

// Search and auto-complete functions
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
    displayPlants(plantsArray);
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
  initializePlantNames();
  const searchBar = document.getElementById('searchBar');
  
  searchBar.addEventListener('input', () => {
    const suggestions = getPlantSuggestions(searchBar.value);
    updateAutoComplete(suggestions);
    searchPlants();
  });
  
  searchBar.addEventListener('focus', () => {
    if (searchBar.value) {
      const suggestions = getPlantSuggestions(searchBar.value);
      updateAutoComplete(suggestions);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (e.target !== searchBar) {
      updateAutoComplete([]);
    }
  });
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', () => {
  readPlants();
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', searchPlants);
  } else {
    console.error("Search bar element not found");
  }
});