const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';
const BASE_URL = 'https://api.themoviedb.org/3';
// Endpoint específico para "Tendencias - Hoy"
const TRENDING_URL = `${BASE_URL}/trending/movie/day?language=es-ES`;
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const container = document.getElementById('trending-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

async function getTrendingMovies() {
    try {
        const res = await fetch(TRENDING_URL, options);
        const data = await res.json();
        showMovies(data.results);
    } catch (error) {
        console.error('Error:', error);
    }
}

function showMovies(items) {
    container.innerHTML = '';
    items.forEach(item => {
        // Manejar tanto películas (movie) como series (tv)
        const title = item.title || item.name || 'Sin título';
        const poster_path = item.poster_path;
        const vote_average = item.vote_average || 0;
        const release_date = item.release_date || item.first_air_date;
        const media_type = item.media_type;
        
        // Ignorar personas en los resultados de búsqueda
        if (media_type === 'person') return;
        
        // Si no hay poster, no mostrar
        if (!poster_path) return;
        
        // Calcular porcentaje (e.g. 7.6 -> 76)
        const percent = Math.round(vote_average * 10);
        
        // Color del borde según puntuación (Lógica BI simple)
        let borderColor = '#21d07a'; // Verde
        if(percent < 70) borderColor = '#d2d531'; // Amarillo
        if(percent < 40) borderColor = '#db2360'; // Rojo

        const card = document.createElement('div');
        card.classList.add('card');
        
        // Formatear fecha (e.g. "21 nov 2025")
        let dateStr = '';
        if (release_date) {
            const dateObj = new Date(release_date);
            dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        card.innerHTML = `
            <div class="image-content">
                <img src="${IMAGE_URL + poster_path}" alt="${title}">
                <div class="options-icon"><i class="fas fa-ellipsis-h"></i></div>
            </div>
            <div class="percent-circle" style="border-color: ${borderColor}">
                ${percent}<sup>%</sup>
            </div>
            <div class="card-content">
                <h2>${title}</h2>
                <p>${dateStr}</p>
            </div>
        `;

        container.appendChild(card);
    });
}

// Iniciar
getTrendingMovies();

// Event listener para el formulario de búsqueda
if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            // Redirect to search page with query parameter
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    });
}