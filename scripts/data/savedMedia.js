import { normalize } from '../utils.js';

const SAVED_KEY = 'cinema-saved';
const CHANGE_EVENT = 'saved-change';
const SAVED_PAGE_SIZE = 20;

const mediaOf = (item) => item.media_type ?? 'movie';
const sameTitle = (item, id, mediaType) => item.id === id && mediaOf(item) === mediaType;

let saved = load();

function load() {
    try {
        const list = JSON.parse(localStorage.getItem(SAVED_KEY));
        return Array.isArray(list) ? list.filter((movie) => Number.isInteger(movie?.id)) : [];
    } catch (error) {
        return [];
    }
}

function persist() {
    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch (error) {
        /* ?????????????????????????????????????????? */
    }
}

function notify() {
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function isSaved(id, mediaType = 'movie') {
    return saved.some((item) => sameTitle(item, id, mediaType));
}

function getSavedMovies() {
    return [...saved];
}

function toggleSaved(movie) {
    if (isSaved(movie.id, movie.mediaType)) {
        saved = saved.filter((item) => !sameTitle(item, movie.id, movie.mediaType));
    } else {
        saved = [movie.toResponse(), ...saved];
    }
    persist();
    notify();
    return isSaved(movie.id, movie.mediaType);
}

function getSavedPage(page = 1, { query = '', genreId = null } = {}) {
    const text = normalize(query);
    const results = saved.filter((movie) =>
        (!text || normalize(movie.title).includes(text)) &&
        (!genreId || movie.genre_ids?.includes(genreId))
    );

    const totalPages = Math.ceil(results.length / SAVED_PAGE_SIZE);
    const current = Math.min(Math.max(page, 1), Math.max(totalPages, 1)); // clamp, e.g. after removing the last card of the last page
    const start = (current - 1) * SAVED_PAGE_SIZE;

    return Promise.resolve({
        page: current,
        total_pages: totalPages,
        total_results: results.length,
        results: results.slice(start, start + SAVED_PAGE_SIZE),
    });
}

// DOM EVENTS
// another tab saved/removed something
window.addEventListener('storage', (event) => {
    if (event.key !== SAVED_KEY) return;
    saved = load();
    notify();
});

export { CHANGE_EVENT, isSaved, getSavedMovies, toggleSaved, getSavedPage };