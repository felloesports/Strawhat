let allPlantNames = [];

// Initialize plant disease search
async function initializePlantDiseaseSearch() {
    window.plantDiseases = await loadPlantDiseaseData();
    populateAllPlantNames();
    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', handleSearchInput);
    searchBar.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    displayPlantDiseases(window.plantDiseases); // Display all diseases on load
}

// Load plant disease data from JSON file
async function loadPlantDiseaseData() {
    try {
        const response = await fetch('plant_diseases.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading plant disease data:', error);
        return [];
    }
}

// Populate all plant names
function populateAllPlantNames() {
    allPlantNames = window.plantDiseases.map(disease => disease.name);
}

// Handle search input
function handleSearchInput(event) {
    const input = event.target.value;
    if (input.length > 0) {
        const suggestions = getPlantSuggestions(input);
        updateAutoComplete(suggestions);
    } else {
        const autoComplete = document.getElementById('autoComplete');
        if (autoComplete) autoComplete.innerHTML = '';
    }
}

// Get plant suggestions
function getPlantSuggestions(input) {
    input = input.toLowerCase();
    return allPlantNames.filter(name =>
        name.toLowerCase().includes(input)
    ).sort((a, b) =>
        a.toLowerCase().indexOf(input) - b.toLowerCase().indexOf(input)
    );
}

// Update auto-complete
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
            searchPlantDiseases(suggestion);
        });
        autoComplete.appendChild(li);
    });
}

// Handle keydown events for navigation
function handleKeyDown(event) {
    const autoComplete = document.getElementById('autoComplete');
    if (autoComplete) {
        const items = autoComplete.getElementsByTagName('li');
        let index = Array.from(items).findIndex(item => item.classList.contains('selected'));
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (index < items.length - 1) index++;
                else index = 0;
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (index > 0) index--;
                else index = items.length - 1;
                break;
            case 'Enter':
                if (index !== -1) {
                    event.preventDefault();
                    items[index].click();
                }
                return;
            default:
                return;
        }
        
        Array.from(items).forEach(item => item.classList.remove('selected'));
        items[index].classList.add('selected');
    }
}

// Handle clicks outside the auto-complete
function handleClickOutside(event) {
    const autoComplete = document.getElementById('autoComplete');
    if (autoComplete && !autoComplete.contains(event.target) && event.target.id !== 'searchBar') {
        autoComplete.innerHTML = '';
    }
}

// Advanced search function
function searchPlantDiseases(searchText) {
    if (searchText === '') {
        displayPlantDiseases(window.plantDiseases);
        return;
    }

    const parsedQuery = parseSearchQuery(searchText);
    const filteredDiseases = window.plantDiseases.filter(disease => {
        const diseaseText = `${disease.name} ${disease.symptoms.join(' ')} ${disease.precautions.join(' ')} ${disease.cure}`.toLowerCase();
        return parsedQuery.searchTerms.some(term => {
            const words = diseaseText.split(/\s+/);
            return words.some(word => levenshteinDistance(term, word) <= 2); // Allow up to 2 character differences
        });
    });

    filteredDiseases.sort((a, b) => {
        const aRelevance = calculateRelevance(a, parsedQuery);
        const bRelevance = calculateRelevance(b, parsedQuery);
        return bRelevance - aRelevance;
    });

    displayPlantDiseases(filteredDiseases);
}

function levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Parse search query
function parseSearchQuery(query) {
    return {
        searchTerms: query.split(/\s+/).filter(term => term.length > 1) // Ignore single-character terms
    };
}

// Calculate relevance score
function calculateRelevance(disease, parsedQuery) {
    const diseaseText = `${disease.name} ${disease.symptoms.join(' ')} ${disease.precautions.join(' ')} ${disease.cure}`.toLowerCase();
    let relevance = 0;

    parsedQuery.searchTerms.forEach(term => {
        const words = diseaseText.split(/\s+/);
        const closestMatch = Math.min(...words.map(word => levenshteinDistance(term, word)));
        if (closestMatch <= 2) {
            relevance += 3 - closestMatch; // Higher score for closer matches
        }
    });

    // Boost relevance if the search term is in the disease name
    if (parsedQuery.searchTerms.some(term => disease.name.toLowerCase().includes(term))) {
        relevance += 5;
    }

    return relevance;
}

// Display plant diseases
function displayPlantDiseases(diseases) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    if (diseases.length === 0) {
        resultsContainer.innerHTML = '<p>No matching diseases found.</p>';
        return;
    }

    diseases.forEach(disease => {
        const diseaseElement = document.createElement('div');
        diseaseElement.className = 'disease-item';
        diseaseElement.innerHTML = `
            <li class="project-item  active" data-filter-item data-category="${disease.plantType}">
            <a href="https://appsweb.netlify.app/webapps/budgetwebapp" target="_blank">

              <figure class="project-img">
                <div class="project-item-icon-box">
                  <ion-icon name="eye-outline"></ion-icon>
                </div>

                <img src="./assets/images/${disease.image}" alt="${disease.name}" loading="lazy">
              </figure>

              <h3 class="project-title">${disease.name}</h3>

              <p class="project-category">${disease.plantType}</p>

            </a>
          </li>
          <h3>Symptoms:</h3>
        <ul>${disease.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}</ul>
        <h3>Precautions:</h3>
            <ul>${disease.precautions.map(precaution => `<li>${precaution}</li>`).join('')}</ul>
            <h3>Cure:</h3>
            <p>${disease.cure}</p>
            <a href="${disease.videoLink}" target="_blank">Watch Video</a>

        `;
        resultsContainer.appendChild(diseaseElement);
        
    });
}

// Call this function when the page loads
initializePlantDiseaseSearch();