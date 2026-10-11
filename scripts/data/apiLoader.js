import { API_KEY, CACHE_MS, MAX_RETRIES } from './config.js';
import { TmdbError } from './models/utils.js';

const API_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/';

const cache = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const asArray = (value) => (Array.isArray(value) ? value : []);

// utils
function validImagePath(path) {
    return typeof path === 'string' && /^\/[\w.-]+\.(jpe?g|png|svg)$/i.test(path) ? path : null;
}

function imageUrl(path, size = 'w500') {
    const safePath = validImagePath(path);
    if (!safePath || !/^(w\d+|original)$/.test(size)) return null;
    return `${IMAGE_URL}${size}${safePath}`;
}

function clearCache() {
    cache.clear();
}

// API
function request(path, params = {}) {
    const url = new URL(API_URL + path);
    const query = { language: "es-ES", ...params };
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

async function getGenres() {
    const data = await request('/genre/movie/list');
    return asArray(data.genres).map(({ id, name }) => ({ id, name }));
  }

export { imageUrl, clearCache, getUpcomingMovies, getGenres };