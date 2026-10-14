import { getGenres, getPopularMovies, getPopularMoviesByGenre, searchMovies } from './data/apiLoader.js';
import { printHome } from './pages/home.js';
import { getHeroImageUrl } from './utils.js';
import { h, icon, svg, setBookmarkState } from './layoutUtils.js';
import { CHANGE_EVENT, isSaved, getSavedPage, getSavedMovies } from './data/savedMovies.js';
import { openMovieModal, closeMovieModal } from './components/movieModal.js';
import { openStatsModal } from './components/statsModal.js';
import Genre from './data/models/genre.js';
import Movie from './data/models/movie.js';
// Data
const pages = [
    {
        title: 'Inicio',
        pageKey: 'home',
        icon: 'home',
    },
    {
        title: 'Guardadas',
        pageKey: 'saved',
        icon: 'bookmark',
    },
    {
        title: 'Series',
        pageKey: 'series',
        icon: 'play',
    },
];

let genres = [];
const THEME_KEY = 'cinema-theme';
let theme = 'dark';
let selectedGenre = null;
let popularPage = 1;
let popularRequestId = 0;
let searchQuery = '';
let searchTimer = null;
let searchGenre = null;
const PAGE_KEYS = pages.map((page) => page.pageKey);
let currentPage = 'home';
let pageRoot = null;
const pageCleanups = [];

// DOM
const app = document.querySelector('body');
let main = null;
const heroCards = [];
let resizeTimer = null;
let themeIcon = null;
let themeButton = null;
let movieGrid = null;

// Utils
function setHeroArt(card, movie, preload = false) {
    const url = getHeroImageUrl(movie);
    if (!url || card.dataset.artUrl === url) return;
    if (card.dataset.url === url) return;

    const paint = () => {
        card.dataset.artUrl = url;
        card.style.setProperty('--art', `url("${url}") center / cover no-repeat`);
        card.classList.add('is-loaded');
    };

    if (!preload) {
        paint();
        return;
    }
    const image = new Image();
    image.onload = () => {
        if (getHeroImageUrl(movie) === url) paint();
    };
    image.src = url;
}

function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch (error) {
        return 'dark'; // ???
    }
}

function applyGenreFilter(genreId) {
    selectedGenre = genreId;
    document.querySelectorAll('#genre-chips .chip').forEach((chip) => {
        const active = Number(chip.dataset.genre) === genreId;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', String(active));
    });
    loadMoviesPage(1);
}

function getRandomItemsShuffle(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// DOM EVENTS
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        heroCards.forEach(({ card, movie }) => setHeroArt(card, movie, true));
    }, 200);
});

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-details]');
    if (trigger) {
        openMovieModal(
            Number(trigger.dataset.details),
            genres,
            setHeroArt,
            trigger.closest('.feature-card, .movie-card')
        );
    }

    const genreTag = event.target.closest('[data-genre-search]');
    if (genreTag) {
        if (document.documentElement.classList.contains('is-morphing')) return;
        closeMovieModal({ morphBack: false });
        applyGenreSearch(Number(genreTag.dataset.genreSearch));
        return;
    }
});

document.addEventListener(CHANGE_EVENT, () => {
    document.querySelectorAll('[data-bookmark]').forEach((button) => {
        setBookmarkState(button, isSaved(Number(button.dataset.bookmark)));
    });
    if (currentPage === 'saved' && movieGrid) refreshSavedPage();
});

// ROUTER
function getRoute() {
    const key = location.hash.slice(1);
    return PAGE_KEYS.includes(key) ? key : 'home';
}

function startRouter() {
    window.addEventListener('hashchange', () => appendContent(getRoute()));
    appendContent(getRoute());
}

function resetPageState() {
    pageCleanups.splice(0).forEach((cleanup) => cleanup());   // stop slider timers
    pageRoot?.remove();
    closeMovieModal({ morphBack: false });

    clearTimeout(searchTimer);
    popularRequestId++;            // ignore responses still arriving for the old page
    searchQuery = '';
    searchGenre = null;
    selectedGenre = null;
    movieGrid = null;
    heroCards.length = 0;
    document.querySelector('#search-input').value = '';
    main.classList.remove('is-searching');

    pageRoot = h('div', { class: 'page' });
    main.appendChild(pageRoot);
    window.scrollTo({ top: 0 });
}

// DOM / VIEWS
function renderThemeButton() {
    if (!themeIcon || !themeButton) return;
    const isDark = theme === 'dark';
    themeIcon.firstElementChild.setAttribute('href', isDark ? '#icon-sun' : '#icon-moon');
    themeButton.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    themeButton.setAttribute('aria-pressed', String(!isDark));
}

function applyTheme(newTheme, remember = false) {
    theme = newTheme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    renderThemeButton();
    if (!remember) return;
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        /* ??? */
    }
}

function setActiveNav(pageKey) {
    document.querySelectorAll('.nav-item').forEach((item) => {
        const active = item.dataset.navKey === pageKey;
        item.classList.toggle('nav-item--active', active);
        if (active) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });

    const page = pages.find((item) => item.pageKey === pageKey);
    document.title = page && pageKey !== 'home'
        ? `${page.title} · Cinema Explorer`
        : 'Cinema Explorer';
}

const printBasicLayout = () => {
    app.classList.add('app');

    // Sidebar
    const sidebar = document.createElement('nav');
    sidebar.classList.add('sidebar');
    sidebar.setAttribute('aria-label', 'Main');
    app.appendChild(sidebar);

    const logo = svg('svg', { class: 'sidebar__logo', viewBox: '0 0 30 30', 'aria-hidden': 'true' },
        svg('circle', { class: 'sidebar__logo-ring', cx: 15, cy: 15, r: 14 }),
        svg('path', { class: 'sidebar__logo-play', d: 'M12 9.5v11l9-5.5-9-5.5z' })
    );
    sidebar.appendChild(logo);    

    const brand = h('a', { class: 'sidebar__brand', href: '#home' },
        logo, h('span', { class: 'sidebar__brand-name', text: 'Cinema Explorer' })
    );
    sidebar.appendChild(brand);

    const nav = document.createElement('div');
    nav.classList.add('sidebar__nav');
    sidebar.appendChild(nav);

    pages.forEach((page, index) => {
        const navItem = document.createElement('a');
        navItem.classList.add('nav-item');
        navItem.setAttribute('href', `#${page.pageKey}`);
        navItem.dataset.navKey = page.pageKey;
        navItem.style.setProperty('--i', index + 1);
        navItem.setAttribute('aria-label', page.title);

        const navItemIcon = icon(page.icon, 'nav-item__icon');
        navItem.appendChild(navItemIcon);

        const navItemText = document.createElement('span');
        navItemText.textContent = page.title;
        navItem.appendChild(navItemText);
        nav.appendChild(navItem);
    });

    main = document.createElement('main');
    main.classList.add('main');
    app.appendChild(main);

    const topBar = document.createElement('header');
    topBar.classList.add('topbar');
    main.appendChild(topBar);

    const search = document.createElement('label');
    search.classList.add('search');
    topBar.appendChild(search);

    const searchIcon = icon('search', 'search__icon');
    search.appendChild(searchIcon);

    const searchInput = document.createElement('input');
    searchInput.classList.add('search__input');
    searchInput.setAttribute('id', 'search-input');
    searchInput.setAttribute('type', 'search');
    searchInput.setAttribute('placeholder', 'Busca por títulos, personas, géneros...');
    searchInput.setAttribute('aria-label', 'Busca por títulos, personas, géneros...');
    searchInput.setAttribute('autocomplete', 'off');
    search.appendChild(searchInput);

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => applySearch(searchInput.value), 400);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        clearTimeout(searchTimer);
        applySearch(searchInput.value);
    });

    const lightModeButton = document.createElement('button');
    lightModeButton.classList.add('icon-button');
    lightModeButton.setAttribute('type', 'button');
    lightModeButton.setAttribute('aria-label', 'Modo Oscuro/Claro');
    topBar.appendChild(lightModeButton);

    const lightModeButtonIcon = icon('sun', 'icon');
    lightModeButton.appendChild(lightModeButtonIcon);

    theme = loadTheme();
    themeIcon = lightModeButtonIcon;
    themeButton = lightModeButton;
    renderThemeButton();
    applyTheme(theme);

    lightModeButton.addEventListener('click', (event) => {
        const next = theme === 'dark' ? 'light' : 'dark';
        if (!document.startViewTransition) return applyTheme(next, true);
        document.documentElement.style.setProperty('--vt-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--vt-y', `${event.clientY}px`);
        document.startViewTransition(() => applyTheme(next, true));
    });
}

async function appendContent(pageKey) {
    currentPage = pageKey;
    setActiveNav(pageKey);
    resetPageState();
    const root = pageRoot;

    if (!genres.length) genres = (await getGenres()).map((genre) => Genre.fromResponse(genre));
    if (root !== pageRoot) return; // navigated again while loading

    switch (pageKey) {
        case 'saved':
            buildMoviesList(pageRoot);
            break;
        case 'home':
        default:
            await printHome(pageRoot, buildMoviesList, genres, heroCards, setHeroArt, setupSlider);
            break;
    }
}

async function buildMoviesList(boxContainer) {
    if (!boxContainer.isConnected) return; // page was reset

    const popular = document.createElement('section');
    popular.classList.add('recommended');
    popular.setAttribute('aria-labelledby', 'recommended-title');
    boxContainer.appendChild(popular);

    const popularHeader = document.createElement('div');
    popularHeader.classList.add('recommended__header');
    popular.appendChild(popularHeader);

    const popularTitle = document.createElement('h2');
    popularTitle.classList.add('recommended__title');
    popularTitle.setAttribute('id', 'recommended-title');
    popularTitle.textContent = getResultsTitle();
    popularHeader.appendChild(popularTitle);

    if (currentPage === 'saved') {
        popularHeader.appendChild(h('button', {
            class: 'chip chip--stats',
            type: 'button',
            onClick: () => openStatsModal(genres),
        }, icon('chart', 'chip__icon'), 'Estadísticas'));
    }

    const clearSearchButton = document.createElement('button');
    clearSearchButton.classList.add('chip', 'chip--clear');
    clearSearchButton.setAttribute('type', 'button');
    clearSearchButton.setAttribute('id', 'clear-search');
    clearSearchButton.hidden = true;
    clearSearchButton.append(icon('close', 'chip__icon'), 'Limpiar búsqueda');
    clearSearchButton.addEventListener('click', clearSearch);
    popularHeader.appendChild(clearSearchButton);

    const popularChips = document.createElement('div');
    popularChips.classList.add('chips');
    popularChips.setAttribute('id', 'genre-chips');
    popularChips.setAttribute('role', 'group');
    popularChips.setAttribute('aria-label', 'Filter by genre');
    popularHeader.appendChild(popularChips);

    const popularChipsButtonAll = document.createElement('button');
    popularChipsButtonAll.classList.add('chip');
    if(!selectedGenre || selectedGenre === -1) popularChipsButtonAll.classList.add('is-active');
    popularChipsButtonAll.setAttribute('type', 'button');
    popularChipsButtonAll.setAttribute('data-genre', -1);
    popularChipsButtonAll.setAttribute('aria-pressed', 'true');
    popularChipsButtonAll.textContent = 'Ver Todo';
    popularChipsButtonAll.addEventListener('click', () => applyGenreFilter(-1));
    popularChips.appendChild(popularChipsButtonAll);

    renderGenreChips(popularChips);

    movieGrid = document.createElement('div');
    movieGrid.classList.add('movie-grid');
    movieGrid.setAttribute('id', 'movie-grid');
    popular.appendChild(movieGrid);

    const popularEmptyState = document.createElement('p');
    popularEmptyState.classList.add('empty-state');
    popularEmptyState.setAttribute('id', 'empty-state');
    popularEmptyState.hidden = true;
    popular.appendChild(popularEmptyState);

    loadMoviesPage(1);
}

function fetchCurrentMovies(page) {
    if (currentPage === 'saved') {
        const genreId = searchGenre?.id ?? (selectedGenre > 0 ? selectedGenre : null);
        return getSavedPage(page, { query: searchQuery, genreId });
    } else {
        if (searchQuery) return searchMovies(searchQuery, page);
        if (searchGenre) return getPopularMoviesByGenre(searchGenre.id, page);
        if (selectedGenre && selectedGenre !== -1) return getPopularMoviesByGenre(selectedGenre, page);
        return getPopularMovies(page);
    }
}

function getResultsTitle() {
    const prefix = currentPage === 'saved' ? 'Guardadas · ' : '';
    if (searchQuery) return `${prefix}Resultados para "${searchQuery}"`;
    if (searchGenre) return `${prefix}Género: ${searchGenre.name}`;
    return currentPage === 'saved' ? 'Guardadas' : 'Lo más popular';
}

function getEmptyMessage() {
    if (searchQuery) return `No hay resultados para "${searchQuery}".`;
    if (currentPage !== 'saved') return 'No hay películas para mostrar.';
    if (searchGenre || selectedGenre > 0) return 'No tienes películas guardadas de este género.';
    return 'Aún no has guardado ninguna película. Pulsa el marcador de cualquier película para tenerla aquí.';
}

function getChipGenres() {
    if (currentPage !== 'saved') return getRandomItemsShuffle(genres, 6);

    const counts = new Map();
    getSavedMovies().forEach((movie) => {
        (movie.genre_ids ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    });

    const sorted = genres
        .filter((genre) => counts.has(genre.id))
        .sort((a, b) => counts.get(b.id) - counts.get(a.id) || a.name.localeCompare(b.name));

    const list = sorted.slice(0, 6);
    const active = sorted.find((genre) => genre.id === selectedGenre);
    if (active && !list.includes(active)) list[list.length - 1] = active;
    return list;
}

function createChip(genreId, label) {
    const active = genreId === -1 ? !(selectedGenre > 0) : selectedGenre === genreId;
    const chip = document.createElement('button');
    chip.classList.add('chip');
    chip.classList.toggle('is-active', active);
    chip.setAttribute('type', 'button');
    chip.setAttribute('aria-pressed', String(active));
    chip.dataset.genre = genreId;
    chip.textContent = label;
    chip.addEventListener('click', () => applyGenreFilter(genreId));
    return chip;
}

function renderGenreChips(container = document.querySelector('#genre-chips')) {
    const chipGenres = getChipGenres();

    if (selectedGenre > 0 && !chipGenres.some((genre) => genre.id === selectedGenre)) {
        selectedGenre = -1;
    }

    container.replaceChildren(
        createChip(-1, 'Ver Todo'),
        ...chipGenres.map((genre) => createChip(genre.id, genre.name))
    );
}

async function loadMoviesPage(page, { quiet = false } = {}) {
    const requestId = ++popularRequestId;
    const popular = document.querySelector('.recommended');
    const emptyState = document.querySelector('#empty-state');
    movieGrid.setAttribute('aria-busy', 'true');

    let loadFailed = false;
    let moviesData;
    try {
        moviesData = await fetchCurrentMovies(page);
    } catch (error) {
        if (requestId !== popularRequestId) return;
        console.error(error);
        loadFailed = true;
        moviesData = { page: 1, total_pages: 0, results: [] };
    }
    if (requestId !== popularRequestId) return; // a newer search/page/genre already started

    popularPage = moviesData.page;
    const totalPages = Math.min(moviesData.total_pages, 500);
    const moviesList = moviesData.results.map((movie) => Movie.fromResponse(movie));

    for (let i = heroCards.length - 1; i >= 0; i--) {
        if (movieGrid.contains(heroCards[i].card)) heroCards.splice(i, 1);
    }

    movieGrid.replaceChildren();
    movieGrid.classList.toggle('is-quiet', quiet);
    moviesList.forEach((movie, index) => {
        movie.buildGeneralCard(movieGrid, index, genres, heroCards, setHeroArt, icon);
    });
    movieGrid.removeAttribute('aria-busy');

     emptyState.hidden = moviesList.length > 0;
    if (loadFailed) {
        emptyState.textContent = 'No se pudieron cargar las películas. Inténtalo de nuevo.';
    } else if (moviesList.length === 0) {
        emptyState.textContent = getEmptyMessage();
    }

    renderPagination(popular, popularPage, totalPages, goToMoviesPage);
}

function goToMoviesPage(page) {
    loadMoviesPage(page);
    document.querySelector('.recommended').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getPageWindow(current, total, radius = 2) {
    const pages = [1];
    const start = Math.max(2, current - radius);
    const end = Math.min(total - 1, current + radius);
    if (start > 2) pages.push('…');
    for (let page = start; page <= end; page++) pages.push(page);
    if (end < total - 1) pages.push('…');
    if (total > 1) pages.push(total);
    return pages;
}

function createPageButton(page, label, disabled = false) {
    const button = document.createElement('button');
    button.classList.add('pagination__button');
    button.setAttribute('type', 'button');
    button.setAttribute('data-page', page);
    button.setAttribute('aria-label', label);
    button.disabled = disabled;
    return button;
}

function renderPagination(container, current, total, onPageChange) {
    let pagination = container.querySelector('.pagination');

    // Created once; later calls just redraw the buttons
    if (!pagination) {
        pagination = document.createElement('nav');
        pagination.classList.add('pagination');
        pagination.setAttribute('aria-label', 'Paginación');
        pagination.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-page]');
            if (!button || button.disabled || button.hasAttribute('aria-current')) return;
            onPageChange(Number(button.dataset.page));
        });
        container.appendChild(pagination);
    } else {        
        // redraw 
        pagination.remove();
        pagination = document.createElement('nav');
        pagination.classList.add('pagination');
        pagination.setAttribute('aria-label', 'Paginación');
        pagination.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-page]');
            if (!button || button.disabled || button.hasAttribute('aria-current')) return;
            onPageChange(Number(button.dataset.page));
        });
        container.appendChild(pagination);
    }

    pagination.replaceChildren();
    pagination.hidden = total < 2;

    const prevButton = createPageButton(current - 1, 'Página anterior', current === 1);
    prevButton.classList.add('pagination__arrow');
    prevButton.appendChild(icon('arrow-left', 'pagination__icon'));
    pagination.appendChild(prevButton);

    getPageWindow(current, total).forEach((item) => {
        if (item === '…') {
            const ellipsis = document.createElement('span');
            ellipsis.classList.add('pagination__ellipsis');
            ellipsis.setAttribute('aria-hidden', 'true');
            ellipsis.textContent = '…';
            pagination.appendChild(ellipsis);
            return;
        }

        const pageButton = createPageButton(item, `Página ${item}`);
        pageButton.textContent = item;
        if (item === current) {
            pageButton.classList.add('is-active');
            pageButton.setAttribute('aria-current', 'page');
        }
        pagination.appendChild(pageButton);
    });

    const nextButton = createPageButton(current + 1, 'Página siguiente', current === total);
    nextButton.classList.add('pagination__arrow');
    nextButton.appendChild(icon('arrow-right', 'pagination__icon'));
    pagination.appendChild(nextButton);
}

function applySearch(value) {
    const query = value.trim();
    if (query.length === 1) return;
    if (query === searchQuery) return;

    searchQuery = query;
    searchGenre = null; // typing replaces a genre search
    updateSearchView();
    loadMoviesPage(1);
}

function applyGenreSearch(genreId) {
    const genre = genres.find((item) => item.id === genreId);
    if (!genre) return;

    clearTimeout(searchTimer); // a pending keystroke search would overwrite this
    searchQuery = '';
    searchGenre = genre;
    document.querySelector('#search-input').value = '';

    updateSearchView();
    goToMoviesPage(1); // loads and scrolls to the results
}

function clearSearch() {
    clearTimeout(searchTimer);
    searchQuery = '';
    searchGenre = null;
    document.querySelector('#search-input').value = '';

    updateSearchView();
    loadMoviesPage(1);
}

function updateSearchView() {
    const isSearching = Boolean(searchQuery || searchGenre);
    main.classList.toggle('is-searching', isSearching);
    const heroRow = document.querySelector('.hero-row');
    if (heroRow) heroRow.inert = isSearching;
    document.querySelector('#genre-chips').hidden = isSearching;
    document.querySelector('#clear-search').hidden = !isSearching;

    const title = document.querySelector('#recommended-title');
    title.textContent = getResultsTitle();
    title.classList.remove('is-swapping');
    void title.offsetWidth;
    title.classList.add('is-swapping');
}

async function refreshSavedPage() {
    const leaving = [...movieGrid.querySelectorAll('.movie-card')]
        .filter((card) => !isSaved(Number(card.dataset.id)));

    leaving.forEach((card) => card.classList.add('is-leaving'));
    await Promise.all(leaving.flatMap((card) =>
        card.getAnimations().map((animation) => animation.finished.catch(() => {}))
    ));

    const genreBefore = selectedGenre;
    renderGenreChips();
    const sameFilter = selectedGenre === genreBefore;

    loadMoviesPage(sameFilter ? popularPage : 1, { quiet: sameFilter });
}

function setupSlider({ slider, track, controls, prevButton, nextButton, dotsContainer, dotLabel }) {
    const slides = [...track.children];
    let current = 0;

    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 6000); };
    const stop = () => clearInterval(timer);
    pageCleanups.push(stop);
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);

    slides.forEach((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'diapositiva');
        slide.setAttribute('aria-label', `${index + 1} de ${slides.length}`);
    });

    const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('type', 'button');
        dot.setAttribute('aria-label', `${dotLabel} ${index + 1}`);
        dot.addEventListener('click', () => goTo(index));
        dotsContainer.appendChild(dot);
        return dot;
    });

    function goTo(index) {
        if (slides.length === 0) return;
        current = (index + slides.length) % slides.length;
        slider.style.setProperty('--index', current);

        slides.forEach((slide, i) => slide.toggleAttribute('inert', i !== current));
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === current);
            if (i === current) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
        start();
    }

    prevButton.addEventListener('click', () => goTo(current - 1));
    nextButton.addEventListener('click', () => goTo(current + 1));
    slider.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') goTo(current - 1);
        if (event.key === 'ArrowRight') goTo(current + 1);
    });

    controls.hidden = slides.length < 2;
    dotsContainer.hidden = slides.length < 2;

    goTo(0);
    return { goTo };
}

export { printBasicLayout, startRouter };