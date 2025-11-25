const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';
const BASE_URL = 'https://api.themoviedb.org/3';
const SEARCH_URL = `${BASE_URL}/search/multi?language=es-ES`;
const IMAGE_URL = 'https://image.tmdb.org/t/p/w185';

const resultsContainer = document.getElementById('results-container');
const searchFormPage = document.getElementById('search-form-page');
const searchInputPage = document.getElementById('search-input-page');
const movieCount = document.getElementById('movie-count');
const tvCount = document.getElementById('tv-count');

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

// Get query from URL parameters
function getQueryParam() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('query') || '';
}

// Search content
async function searchContent(query) {
    if (!query) return;
    
    try {
        const res = await fetch(`${SEARCH_URL}&query=${encodeURIComponent(query)}`, options);
        const data = await res.json();
        displayResults(data.results);
        updateCounts(data.results);
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        resultsContainer.innerHTML = '<p class="no-results">Error al realizar la búsqueda.</p>';
    }
}

// Display results in vertical layout
function displayResults(items) {
    resultsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron resultados.</p>';
        return;
    }
    
    items.forEach(item => {
        // Filter out persons
        if (item.media_type === 'person') return;
        
        const title = item.title || item.name || 'Sin título';
        const poster_path = item.poster_path;
        const overview = item.overview || 'Sin descripción disponible.';
        const release_date = item.release_date || item.first_air_date || '';
        const media_type = item.media_type === 'movie' ? 'Película' : 'Serie';
        
        const card = document.createElement('div');
        card.classList.add('result-card');
        
        // Format date
        let dateStr = '';
        if (release_date) {
            const dateObj = new Date(release_date);
            dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        // Poster image or placeholder
        const posterSrc = poster_path 
            ? `${IMAGE_URL}${poster_path}` 
            : 'https://via.placeholder.com/94x141/032541/ffffff?text=Sin+imagen';
        
        card.innerHTML = `
            <div class="result-poster">
                <img src="${posterSrc}" alt="${title}">
            </div>
            <div class="result-info">
                <div class="result-header">
                    <h2>${title}</h2>
                    <span class="result-date">${dateStr}</span>
                </div>
                <p class="result-overview">${overview}</p>
            </div>
        `;
        
        resultsContainer.appendChild(card);
    });
}

// Update sidebar counts
function updateCounts(items) {
    let movies = 0;
    let tvShows = 0;
    
    if (items) {
        items.forEach(item => {
            if (item.media_type === 'movie') movies++;
            else if (item.media_type === 'tv') tvShows++;
        });
    }
    
    movieCount.textContent = movies;
    tvCount.textContent = tvShows;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const query = getQueryParam();
    if (query) {
        searchInputPage.value = query;
        searchContent(query);
    }
});

// Handle form submission on search page
searchFormPage.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInputPage.value.trim();
    if (query) {
        // Update URL without reloading
        window.history.pushState({}, '', `search.html?query=${encodeURIComponent(query)}`);
        searchContent(query);
    }
});
