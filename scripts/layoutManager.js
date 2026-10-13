import { getGenres, getPopularMovies, getPopularMoviesByGenre, searchMovies } from './data/apiLoader.js';
import { printHome } from './pages/home.js';
import { getHeroImageUrl } from './utils.js';
import { h, icon, svg } from './layoutUtils.js';
import { openMovieModal } from './components/movieModal.js';
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
    const recommendedChips = document.querySelector('#genre-chips');
    recommendedChips.querySelectorAll('button').forEach((button) => button.classList.remove('is-active'));
    recommendedChips.querySelector(`button[data-genre="${genreId}"]`).classList.add('is-active');
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
    if (!trigger) return;
    openMovieModal(
        Number(trigger.dataset.details),
        genres,
        setHeroArt,
        trigger.closest('.feature-card, .movie-card')
    );
});

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

const printBasicLayout = (currentPage) => {
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

    const brand = h('a', { class: 'sidebar__brand', href: '#' },
        logo, h('span', { class: 'sidebar__brand-name', text: 'Cinema Explorer' })
    );
    sidebar.appendChild(brand);

    const nav = document.createElement('div');
    nav.classList.add('sidebar__nav');
    sidebar.appendChild(nav);

    pages.forEach((page, index) => {
        const navItem = document.createElement('a');
        navItem.classList.add('nav-item');
        navItem.setAttribute('href', '#');
        if(page.pageKey === currentPage) {
            navItem.classList.add('nav-item--active');
            navItem.setAttribute('aria-current', 'page');
            navItem.style.setProperty('--i', index + 1);
        }
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

async function appendContent(contentType) {
    genres = (await getGenres()).map((genre) => Genre.fromResponse(genre));

    switch(contentType) {
        case 'home':
        default:
            await printHome(main, buildMoviesList, genres, heroCards, setHeroArt, setupSlider);
            break;
    } 
}

async function buildMoviesList(boxContainer) {
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
    popularTitle.textContent = 'Lo más popular';
    popularHeader.appendChild(popularTitle);

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

    const genreList = getRandomItemsShuffle(genres, 6);

    genreList.forEach((genre) => {
        const popularChipsButton = document.createElement('button');
        popularChipsButton.classList.add('chip');
        if(selectedGenre === genre.id) popularChipsButton.classList.add('is-active');
        popularChipsButton.setAttribute('type', 'button');
        popularChipsButton.setAttribute('data-genre', genre.id);
        popularChipsButton.setAttribute('aria-pressed', 'false');
        popularChipsButton.textContent = genre.name;

        popularChipsButton.addEventListener('click', () => applyGenreFilter(genre.id));
        popularChips.appendChild(popularChipsButton);
    });

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
    if (searchQuery) return searchMovies(searchQuery, page);
    if (selectedGenre && selectedGenre !== -1) return getPopularMoviesByGenre(selectedGenre, page);
    return getPopularMovies(page);
}

async function loadMoviesPage(page) {
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
    moviesList.forEach((movie, index) => {
        movie.buildGeneralCard(movieGrid, index, genres, heroCards, setHeroArt, icon);
    });
    movieGrid.removeAttribute('aria-busy');

     emptyState.hidden = moviesList.length > 0;
    if (loadFailed) {
        emptyState.textContent = 'No se pudieron cargar las películas. Inténtalo de nuevo.';
    } else if (moviesList.length === 0) {
        emptyState.textContent = searchQuery
            ? `No hay resultados para "${searchQuery}".`
            : 'No hay películas para mostrar.';
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
    updateSearchView();
    loadMoviesPage(1);
}

function updateSearchView() {
    const isSearching = Boolean(searchQuery);
    main.classList.toggle('is-searching', isSearching);
    document.querySelector('.hero-row').inert = isSearching;
    document.querySelector('#genre-chips').hidden = isSearching;
    document.querySelector('#recommended-title').textContent = isSearching
        ? `Resultados para "${searchQuery}"`
        : 'Lo más popular';

    const title = document.querySelector('#recommended-title');
    title.classList.remove('is-swapping');
    void title.offsetWidth;
    title.classList.add('is-swapping');
}

function setupSlider({ slider, track, controls, prevButton, nextButton, dotsContainer, dotLabel }) {
    const slides = [...track.children];
    let current = 0;

    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 6000); };
    const stop = () => clearInterval(timer);
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

export { printBasicLayout, appendContent };