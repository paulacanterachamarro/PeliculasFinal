const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces';
const PROFILE_URL = 'https://image.tmdb.org/t/p/w138_and_h175_face';
const THUMBNAIL_URL = 'https://image.tmdb.org/t/p/w300';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const mediaId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

// Language codes to names mapping
const languageNames = {
    'en': 'Inglés',
    'es': 'Español',
    'fr': 'Francés',
    'de': 'Alemán',
    'it': 'Italiano',
    'pt': 'Portugués',
    'ja': 'Japonés',
    'ko': 'Coreano',
    'zh': 'Chino',
    'ru': 'Ruso',
    'ar': 'Árabe',
    'hi': 'Hindi'
};

// Status translations
const statusTranslations = {
    'Released': 'Estrenada',
    'Post Production': 'Post producción',
    'In Production': 'En producción',
    'Planned': 'Planeada',
    'Canceled': 'Cancelada',
    'Rumored': 'Rumoreada',
    'Returning Series': 'Serie en emisión',
    'Ended': 'Finalizada',
    'Pilot': 'Piloto'
};

// Media state
let currentMediaTab = 'videos';
let mediaData = {
    videos: [],
    backdrops: [],
    posters: []
};
let trailerKey = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (mediaId) {
        loadDetails();
    } else {
        document.body.innerHTML = '<p style="padding: 40px; text-align: center;">No se ha especificado ningún contenido.</p>';
    }

    // Setup media tabs
    setupMediaTabs();

    // Setup video modal
    setupVideoModal();
});

async function loadDetails() {
    try {
        // Fetch all data in parallel
        const [detailRes, creditsRes, videosRes, imagesRes, keywordsRes] = await Promise.all([
            fetch(`${BASE_URL}/${mediaType}/${mediaId}?language=es-ES`, options),
            fetch(`${BASE_URL}/${mediaType}/${mediaId}/credits?language=es-ES`, options),
            fetch(`${BASE_URL}/${mediaType}/${mediaId}/videos?language=es-ES`, options),
            fetch(`${BASE_URL}/${mediaType}/${mediaId}/images`, options),
            fetch(`${BASE_URL}/${mediaType}/${mediaId}/keywords`, options)
        ]);

        const [details, credits, videos, images, keywords] = await Promise.all([
            detailRes.json(),
            creditsRes.json(),
            videosRes.json(),
            imagesRes.json(),
            keywordsRes.json()
        ]);

        displayDetails(details);
        displayCredits(credits);
        displayMedia(videos, images);
        displayKeywords(keywords);
        displaySidebarInfo(details);

    } catch (error) {
        console.error('Error loading details:', error);
    }
}

function displayDetails(data) {
    // Update page title
    const title = data.title || data.name || 'Sin título';
    document.title = `${title} - TMDB Clone`;

    // Backdrop
    const backdropSection = document.getElementById('detail-backdrop');
    if (data.backdrop_path) {
        backdropSection.style.backgroundImage = `linear-gradient(to right, rgba(3,37,65, 0.9) 0%, rgba(3,37,65, 0.7) 100%), url('${BACKDROP_URL}${data.backdrop_path}')`;
    }

    // Poster
    const posterImg = document.getElementById('poster-img');
    if (data.poster_path) {
        posterImg.src = `${IMAGE_URL}${data.poster_path}`;
        posterImg.alt = title;
    } else {
        posterImg.parentElement.innerHTML = '<div class="no-poster-detail"><i class="fas fa-film"></i></div>';
    }

    // Title and year
    const releaseDate = data.release_date || data.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    document.getElementById('detail-title').textContent = year ? `${title} (${year})` : title;

    // Date, genres, runtime
    let metaItems = [];
    
    if (releaseDate) {
        const dateObj = new Date(releaseDate);
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        metaItems.push(formattedDate + ' (ES)');
    }

    if (data.genres && data.genres.length > 0) {
        metaItems.push(data.genres.map(g => g.name).join(', '));
    }

    if (data.runtime) {
        const hours = Math.floor(data.runtime / 60);
        const minutes = data.runtime % 60;
        metaItems.push(`${hours}h ${minutes}m`);
    } else if (data.episode_run_time && data.episode_run_time.length > 0) {
        metaItems.push(`${data.episode_run_time[0]}m por episodio`);
    }

    document.getElementById('detail-meta').innerHTML = metaItems.map((item, index) => 
        `<span>${item}</span>${index < metaItems.length - 1 ? '<span class="separator">•</span>' : ''}`
    ).join('');

    // Score
    const score = Math.round((data.vote_average || 0) * 10);
    const scoreCircle = document.getElementById('score-circle');
    document.getElementById('score-value').textContent = score;
    
    // Color based on score
    let borderColor = '#21d07a'; // Green
    if (score < 70) borderColor = '#d2d531'; // Yellow
    if (score < 40) borderColor = '#db2360'; // Red
    scoreCircle.style.borderColor = borderColor;

    // Tagline
    const taglineEl = document.getElementById('detail-tagline');
    if (data.tagline) {
        taglineEl.textContent = data.tagline;
        taglineEl.style.display = 'block';
    } else {
        taglineEl.style.display = 'none';
    }

    // Overview
    document.getElementById('detail-overview-text').textContent = data.overview || 'Sin descripción disponible.';
}

function displayCredits(credits) {
    // Display main crew (Director, Writer, etc.)
    const crewContainer = document.getElementById('detail-crew');
    crewContainer.innerHTML = '';

    if (credits.crew && credits.crew.length > 0) {
        // Group crew by job
        const importantJobs = ['Director', 'Writer', 'Screenplay', 'Story', 'Characters', 'Creator'];
        const crewMap = new Map();
        
        credits.crew.forEach(member => {
            if (importantJobs.includes(member.job)) {
                if (crewMap.has(member.name)) {
                    crewMap.get(member.name).jobs.push(member.job);
                } else {
                    crewMap.set(member.name, { name: member.name, jobs: [member.job] });
                }
            }
        });

        // Display up to 6 crew members
        let count = 0;
        crewMap.forEach((member) => {
            if (count >= 6) return;
            const crewItem = document.createElement('div');
            crewItem.classList.add('crew-item');
            crewItem.innerHTML = `
                <p class="crew-name">${member.name}</p>
                <p class="crew-job">${member.jobs.join(', ')}</p>
            `;
            crewContainer.appendChild(crewItem);
            count++;
        });
    }

    // Display cast
    const castContainer = document.getElementById('cast-container');
    castContainer.innerHTML = '';

    if (credits.cast && credits.cast.length > 0) {
        // Show top 9 cast members
        const topCast = credits.cast.slice(0, 9);
        
        topCast.forEach(actor => {
            const castCard = document.createElement('div');
            castCard.classList.add('cast-card');
            
            castCard.innerHTML = `
                <div class="cast-photo">
                    ${actor.profile_path 
                        ? `<img src="${PROFILE_URL}${actor.profile_path}" alt="${actor.name}">`
                        : `<div class="no-photo"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <div class="cast-info">
                    <p class="cast-name">${actor.name}</p>
                    <p class="cast-character">${actor.character || ''}</p>
                </div>
            `;
            
            castContainer.appendChild(castCard);
        });
    } else {
        castContainer.innerHTML = '<p class="no-data">No hay información del reparto disponible.</p>';
    }
}

function displayMedia(videos, images) {
    // Store media data
    mediaData.videos = videos.results || [];
    mediaData.backdrops = images.backdrops || [];
    mediaData.posters = images.posters || [];

    // Update counts
    document.getElementById('video-count').textContent = mediaData.videos.length;
    document.getElementById('backdrop-count').textContent = mediaData.backdrops.length;
    document.getElementById('poster-count').textContent = mediaData.posters.length;

    // Find trailer for the trailer button
    const trailer = mediaData.videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
        trailerKey = trailer.key;
        const trailerBtn = document.getElementById('trailer-btn');
        trailerBtn.style.display = 'flex';
        trailerBtn.addEventListener('click', () => openVideoModal(trailer.key));
    }

    // Display initial tab content
    displayMediaTab('videos');
}

function displayMediaTab(tab) {
    const container = document.getElementById('media-container');
    container.innerHTML = '';

    if (tab === 'videos') {
        if (mediaData.videos.length === 0) {
            container.innerHTML = '<p class="no-data">No hay vídeos disponibles.</p>';
            return;
        }

        mediaData.videos.slice(0, 6).forEach(video => {
            if (video.site === 'YouTube') {
                const mediaItem = document.createElement('div');
                mediaItem.classList.add('media-item', 'video-item');
                mediaItem.innerHTML = `
                    <div class="video-thumbnail" data-key="${video.key}">
                        <img src="https://img.youtube.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}">
                        <div class="play-overlay"><i class="fas fa-play"></i></div>
                    </div>
                    <p class="video-title">${video.name}</p>
                `;
                mediaItem.querySelector('.video-thumbnail').addEventListener('click', () => openVideoModal(video.key));
                container.appendChild(mediaItem);
            }
        });
    } else if (tab === 'backdrops') {
        if (mediaData.backdrops.length === 0) {
            container.innerHTML = '<p class="no-data">No hay imágenes de fondo disponibles.</p>';
            return;
        }

        mediaData.backdrops.slice(0, 6).forEach(backdrop => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item', 'backdrop-item');
            mediaItem.innerHTML = `
                <img src="${THUMBNAIL_URL}${backdrop.file_path}" alt="Backdrop">
            `;
            container.appendChild(mediaItem);
        });
    } else if (tab === 'posters') {
        if (mediaData.posters.length === 0) {
            container.innerHTML = '<p class="no-data">No hay carteles disponibles.</p>';
            return;
        }

        mediaData.posters.slice(0, 6).forEach(poster => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item', 'poster-item');
            mediaItem.innerHTML = `
                <img src="${THUMBNAIL_URL}${poster.file_path}" alt="Poster">
            `;
            container.appendChild(mediaItem);
        });
    }
}

function setupMediaTabs() {
    const tabs = document.querySelectorAll('.media-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMediaTab = tab.dataset.tab;
            displayMediaTab(currentMediaTab);
        });
    });
}

function displayKeywords(keywordsData) {
    const keywordsList = document.getElementById('keywords-list');
    keywordsList.innerHTML = '';

    const keywords = keywordsData.keywords || keywordsData.results || [];
    
    if (keywords.length === 0) {
        keywordsList.innerHTML = '<span class="no-keywords">No hay palabras clave</span>';
        return;
    }

    keywords.slice(0, 15).forEach(keyword => {
        const keywordTag = document.createElement('span');
        keywordTag.classList.add('keyword-tag');
        keywordTag.textContent = keyword.name;
        keywordsList.appendChild(keywordTag);
    });
}

function displaySidebarInfo(data) {
    // Status
    const status = statusTranslations[data.status] || data.status || '-';
    document.getElementById('info-status').textContent = status;

    // Original language
    const langCode = data.original_language || '';
    const langName = languageNames[langCode] || langCode.toUpperCase() || '-';
    document.getElementById('info-language').textContent = langName;

    // Budget
    if (data.budget && data.budget > 0) {
        document.getElementById('info-budget').textContent = '$' + data.budget.toLocaleString('en-US') + '.00';
    } else {
        document.getElementById('info-budget').textContent = '-';
    }

    // Revenue
    if (data.revenue && data.revenue > 0) {
        document.getElementById('info-revenue').textContent = '$' + data.revenue.toLocaleString('en-US') + '.00';
    } else {
        document.getElementById('info-revenue').textContent = '-';
    }
}

function setupVideoModal() {
    const modal = document.getElementById('video-modal');
    const closeBtn = document.querySelector('.video-close');
    
    closeBtn.addEventListener('click', closeVideoModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
}

function openVideoModal(videoKey) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;
    modal.style.display = 'flex';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    modal.style.display = 'none';
    iframe.src = '';
}
