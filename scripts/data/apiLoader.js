import { API_KEY, LANGUAGE, CACHE_MS, MAX_RETRIES } from './config.js';
import { TmdbError, todayISO } from './models/utils.js';

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

async function getUpcoming(mediaType = 'movie') {
    const dateFilter = mediaType === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
    return (await request(`/discover/${mediaType}`, { [dateFilter]: todayISO(), sort_by: 'popularity.desc', include_adult: true }));
}

async function getTopRated(mediaType = 'movie') {
    return (await request(`/${mediaType}/top_rated`));
}

async function getPopular(mediaType = 'movie', page = 1) {
    return (await request(`/${mediaType}/popular`, { page }));
}

async function getByGenre(mediaType, genreId, page = 1) {
    return (await request(`/discover/${mediaType}`, { with_genres: genreId, page, sort_by: 'popularity.desc', include_adult: true }));
}

async function searchTitles(mediaType, query, page = 1) {
    return (await request(`/search/${mediaType}`, { query, page, include_adult: false }));
}

async function discover(mediaType, filters, page = 1) {
    const date = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
    const sortBy = {
        popularity: 'popularity.desc',
        score: 'vote_average.desc',
        date: `${date}.desc`,
    }[filters.sort] ?? 'popularity.desc';

    return (await request(`/discover/${mediaType}`, {
        with_genres: filters.genres.join(filters.genreMode === 'any' ? '|' : ','),
        [`${date}.gte`]: filters.yearFrom ? `${filters.yearFrom}-01-01` : undefined,
        // "newest first" would otherwise start with announced titles that have no data yet
        [`${date}.lte`]: filters.yearTo ? `${filters.yearTo}-12-31` : (filters.sort === 'date' ? todayISO() : undefined),
        'vote_average.gte': filters.minScore || undefined,
        // a 9.5 from 3 votes is noise: require some votes when score matters
        'vote_count.gte': (filters.minScore || filters.sort === 'score') ? 100 : undefined,
        with_original_language: filters.language || undefined,
        sort_by: sortBy,
        include_adult: false,
        page,
    }));
}

async function getGenres(mediaType = 'movie') {
    const data = await request(`/genre/${mediaType}/list`);
    return asArray(data.genres).map(({ id, name }) => ({ id, name }));
}

async function getMediaDetails(mediaType, id) {
    return (await request(`/${mediaType}/${id}`, {
        append_to_response: 'credits,videos,recommendations',
        include_video_language: 'es,en,null', // many titles only have English trailers
    }));
}

export { 
    clearCache, getUpcoming, getGenres, getTopRated, getPopular, getByGenre, searchTitles,
    discover, getMediaDetails
 };