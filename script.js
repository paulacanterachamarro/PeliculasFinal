const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';
const BASE_URL = 'https://api.themoviedb.org/3';
// Endpoint específico para "Tendencias - Hoy"
const TRENDING_URL = `${BASE_URL}/trending/movie/day?language=es-ES`;
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const container = document.getElementById('trending-container');

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

function showMovies(movies) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const { title, poster_path, vote_average, release_date } = movie;
        
        // Calcular porcentaje (e.g. 7.6 -> 76)
        const percent = Math.round(vote_average * 10);
        
        // Color del borde según puntuación (Lógica BI simple)
        let borderColor = '#21d07a'; // Verde
        if(percent < 70) borderColor = '#d2d531'; // Amarillo
        if(percent < 40) borderColor = '#db2360'; // Rojo

        const card = document.createElement('div');
        card.classList.add('card');
        
        // Formatear fecha (e.g. "21 nov 2025")
        const dateObj = new Date(release_date);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

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