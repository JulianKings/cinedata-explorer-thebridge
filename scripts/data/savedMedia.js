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

function matchesFilters(item, filters) {
    const ids = item.genre_ids ?? [];
    const year = Number(item.release_date?.slice(0, 4)) || null;

    if (filters.genres.length) {
        const match = filters.genreMode === 'any'
            ? filters.genres.some((id) => ids.includes(id))
            : filters.genres.every((id) => ids.includes(id));
        if (!match) return false;
    }
    if (filters.yearFrom && (!year || year < filters.yearFrom)) return false;
    if (filters.yearTo && (!year || year > filters.yearTo)) return false;
    if (filters.minScore && !(item.vote_average >= filters.minScore)) return false;
    return true;
}

const SAVED_SORTERS = {
    score: (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
    date: (a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''),
};

function getSavedPage(page = 1, { query = '', genreId = null, filters = null } = {}) {
    const text = normalize(query);
    let results = saved.filter((movie) =>
        (!text || normalize(movie.title).includes(text)) &&
        (!genreId || movie.genre_ids?.includes(genreId))
    );

    if (filters) {
        results = results.filter((item) => matchesFilters(item, filters));
        if (SAVED_SORTERS[filters.sort]) results = [...results].sort(SAVED_SORTERS[filters.sort]);
    }

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