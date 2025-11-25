const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const POSTER_URL = 'https://image.tmdb.org/t/p/w94_and_h141_bestv2';

// Constants
const RESULTS_PER_PAGE = 20;
const OVERVIEW_MAX_LENGTH = 250;

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

// Get query from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('query') || '';

// Current state
let currentCategory = 'movie';
let currentPage = 1;
let allResults = {
    movie: [],
    tv: [],
    person: []
};
let totalResults = {
    movie: 0,
    tv: 0,
    person: 0
};

// DOM Elements
const resultsContainer = document.getElementById('search-results-list');
const paginationContainer = document.getElementById('pagination');
const movieCountEl = document.getElementById('movie-count');
const tvCountEl = document.getElementById('tv-count');
const personCountEl = document.getElementById('person-count');
const categoryItems = document.querySelectorAll('.category-item');

// Initialize search on page load
document.addEventListener('DOMContentLoaded', () => {
    if (searchQuery) {
        performSearch(searchQuery);
    } else {
        resultsContainer.innerHTML = '<p class="no-results">No se ha especificado una búsqueda.</p>';
    }

    // Add event listeners to category items
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            setActiveCategory(category);
        });
    });
});

function setActiveCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // Update active class
    categoryItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
    
    displayResults();
}

async function performSearch(query) {
    try {
        // Execute all searches in parallel for better performance
        const [movieRes, tvRes, personRes] = await Promise.all([
            fetch(`${BASE_URL}/search/movie?language=es-ES&query=${encodeURIComponent(query)}`, options),
            fetch(`${BASE_URL}/search/tv?language=es-ES&query=${encodeURIComponent(query)}`, options),
            fetch(`${BASE_URL}/search/person?language=es-ES&query=${encodeURIComponent(query)}`, options)
        ]);
        
        const [movieData, tvData, personData] = await Promise.all([
            movieRes.json(),
            tvRes.json(),
            personRes.json()
        ]);
        
        allResults.movie = movieData.results || [];
        totalResults.movie = movieData.total_results || 0;
        
        allResults.tv = tvData.results || [];
        totalResults.tv = tvData.total_results || 0;
        
        allResults.person = personData.results || [];
        totalResults.person = personData.total_results || 0;
        
        // Update counts in sidebar
        updateCounts();
        
        // Display results for current category
        displayResults();
        
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        resultsContainer.innerHTML = '<p class="no-results">Error al realizar la búsqueda. Por favor, intente de nuevo.</p>';
    }
}

function updateCounts() {
    movieCountEl.textContent = totalResults.movie;
    tvCountEl.textContent = totalResults.tv;
    personCountEl.textContent = totalResults.person;
}

function displayResults() {
    const results = allResults[currentCategory];
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron resultados para esta categoría.</p>';
        paginationContainer.innerHTML = '';
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    results.forEach(item => {
        const resultItem = createResultItem(item, currentCategory);
        resultsContainer.appendChild(resultItem);
    });
    
    // Add pagination if needed
    updatePagination();
}

function createResultItem(item, category) {
    const div = document.createElement('div');
    div.classList.add('result-item');
    
    if (category === 'person') {
        // Person result layout
        const name = item.name || 'Desconocido';
        const profilePath = item.profile_path;
        const knownFor = item.known_for_department || '';
        const knownForItems = item.known_for || [];
        
        const knownForTitles = knownForItems
            .map(kf => kf.title || kf.name)
            .filter(Boolean)
            .join(', ');
        
        div.innerHTML = `
            <div class="result-poster">
                ${profilePath 
                    ? `<img src="${POSTER_URL}${profilePath}" alt="${name}">`
                    : `<div class="no-poster"><i class="fas fa-user"></i></div>`
                }
            </div>
            <div class="result-info">
                <h3 class="result-title">${name}</h3>
                <p class="result-details">${knownFor}${knownForTitles ? ' • ' + knownForTitles : ''}</p>
            </div>
        `;
    } else {
        // Movie or TV result layout
        const title = item.title || item.name || 'Sin título';
        const posterPath = item.poster_path;
        const releaseDate = item.release_date || item.first_air_date || '';
        const overview = item.overview || 'Sin descripción disponible.';
        
        // Format date
        let formattedDate = '';
        if (releaseDate) {
            const dateObj = new Date(releaseDate);
            formattedDate = dateObj.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        }
        
        // Truncate overview if too long
        const truncatedOverview = overview.length > OVERVIEW_MAX_LENGTH 
            ? overview.substring(0, OVERVIEW_MAX_LENGTH) + '...' 
            : overview;
        
        div.innerHTML = `
            <div class="result-poster">
                ${posterPath 
                    ? `<img src="${POSTER_URL}${posterPath}" alt="${title}">`
                    : `<div class="no-poster"><i class="fas fa-film"></i></div>`
                }
            </div>
            <div class="result-info">
                <h3 class="result-title">${title}</h3>
                <p class="result-date">${formattedDate}</p>
                <p class="result-overview">${truncatedOverview}</p>
            </div>
        `;
    }
    
    return div;
}

function updatePagination() {
    const total = totalResults[currentCategory];
    const totalPages = Math.ceil(total / RESULTS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}">&lt;</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}">&gt;</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination buttons
    paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            goToPage(page);
        });
    });
}

async function goToPage(page) {
    currentPage = page;
    
    try {
        let endpoint = '';
        if (currentCategory === 'movie') {
            endpoint = `${BASE_URL}/search/movie?language=es-ES&query=${encodeURIComponent(searchQuery)}&page=${page}`;
        } else if (currentCategory === 'tv') {
            endpoint = `${BASE_URL}/search/tv?language=es-ES&query=${encodeURIComponent(searchQuery)}&page=${page}`;
        } else {
            endpoint = `${BASE_URL}/search/person?language=es-ES&query=${encodeURIComponent(searchQuery)}&page=${page}`;
        }
        
        const res = await fetch(endpoint, options);
        const data = await res.json();
        allResults[currentCategory] = data.results || [];
        
        displayResults();
        
        // Scroll to top of results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar la página:', error);
    }
}
