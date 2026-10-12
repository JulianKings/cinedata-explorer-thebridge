import { API_KEY, LANGUAGE, CACHE_MS, MAX_RETRIES } from './config.js';
import { TmdbError } from './models/utils.js';

const API_URL = 'https://api.themoviedb.org/3';

const cache = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const asArray = (value) => (Array.isArray(value) ? value : []);

// utils
function clearCache() {
    cache.clear();
}

// API
function request(path, params = {}) {
    const url = new URL(API_URL + path);
    const query = { language: LANGUAGE, ...params };
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    const cacheKey = url.toString();
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return hit.promise;

    const promise = callTMDB(url).catch((error) => {
        cache.delete(cacheKey);
        throw error;
    });

    cache.set(cacheKey, { expires: Date.now() + CACHE_MS, promise });
    return promise;
}

async function callTMDB(publicUrl) {
    const url = new URL(publicUrl);
    url.searchParams.set('api_key', API_KEY);

    for (let attempt = 0; ; attempt++) {
        let response;
        try {
            response = await fetch(url);
        } catch (cause) {
            throw new TmdbError(`Error llamando a TMDB: ${cause?.message || cause}`, {
                url: publicUrl.toString(),
                cause,
            });
        }

        // tratar con el rate limited
        if (response.status === 429 && attempt < MAX_RETRIES) {
            const header = response.headers.get('retry-after');
            const seconds = header !== null && !Number.isNaN(Number(header)) ? Number(header) : 1;
            await sleep(Math.min(seconds, 10) * 1000);
            continue;
        }

        if (!response.ok) {
            let detail = '';
            try {
                detail = (await response.json()).status_message || '';
            } catch {
                /* ??? */
            }

            throw new TmdbError(`TMDB ${response.status}: ${detail || response.statusText || 'solicitud fallida'}`, {
                status: response.status,
                url: publicUrl.toString(),
            });
        }

        return response.json();
    }
}

async function getUpcomingMovies() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(now.getDate()).padStart(2, '0');

    const formattedDate = `${yyyy}-${mm}-${dd}`;
    return (await request('/discover/movie', { "primary_release_date.gte": formattedDate, sort_by: 'popularity.desc', include_adult: true }));
}

async function getTopRatedMovies() {
    return (await request('/movie/top_rated', { sort_by: 'vote_average.desc', 'vote_count.gte': 1000000, include_adult: true }));
}

async function getPopularMovies(page = 1) {
    return (await request('/movie/popular', { sort_by: 'popularity.desc', page, include_adult: true }));
}

async function getPopularMoviesByGenre(genreId, page = 1) {
    return (await request('/discover/movie', { "with_genres": genreId, page, sort_by: 'popularity.desc', include_adult: true }));
}

async function getGenres() {
    const data = await request('/genre/movie/list');
    return asArray(data.genres).map(({ id, name }) => ({ id, name }));
  }

export { clearCache, getUpcomingMovies, getGenres, getTopRatedMovies, getPopularMovies, getPopularMoviesByGenre };