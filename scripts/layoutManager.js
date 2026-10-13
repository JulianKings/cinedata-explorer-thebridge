import { getUpcomingMovies, getGenres, getTopRatedMovies, getPopularMovies, getPopularMoviesByGenre, searchMovies } from './data/apiLoader.js';
import { getHeroImageUrl } from './utils.js';
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
const SVG_NS = 'http://www.w3.org/2000/svg';
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
function applyAttrs(node, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (key === 'text') {
            node.textContent = value;
        } else if (key === 'hidden') {
            node.hidden = Boolean(value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            node.setAttribute(key, value === true ? '' : value);
        }
    }
}

function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
}

function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
}

function icon(name, classes = '') {
    return svg(
        'svg',
        { class: `icon ${classes}`.trim(), 'aria-hidden': 'true' },
        svg('use', { href: `#icon-${name}` })
    );
}

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
        if (getHeroImageUrl(movie) === url) paint(); // skip it if the window changed again meanwhile
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

    pages.forEach((page) => {
        const navItem = document.createElement('a');
        navItem.classList.add('nav-item');
        navItem.setAttribute('href', '#');
        if(page.pageKey === currentPage) {
            navItem.classList.add('nav-item--active');
            navItem.setAttribute('aria-current', 'page');
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

    theme = loadTheme();
}

async function appendContent(contentType) {
    switch(contentType) {
        case 'home':
        default:
            await printHome();
            break;
    } 
}

async function printHome() {
    genres = (await getGenres()).map((genre) => Genre.fromResponse(genre));
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

    const heroCollapse = document.createElement('div');
    heroCollapse.classList.add('hero-collapse');
    main.appendChild(heroCollapse);

    const heroRow = document.createElement('div');
    heroRow.classList.add('hero-row');
    heroCollapse.appendChild(heroRow);

    const upcomingMovies = (await getUpcomingMovies()).results.map((movie) => Movie.fromResponse(movie));

    const upcomingMovieBox = document.createElement('section');
    upcomingMovieBox.classList.add('feature', 'feature--primary');
    upcomingMovieBox.setAttribute('aria-labelledby', 'new-releases-title');
    heroRow.appendChild(upcomingMovieBox);

    const upcomingMovieBoxTitle = document.createElement('h2');
    upcomingMovieBoxTitle.classList.add('feature__title');
    upcomingMovieBoxTitle.setAttribute('id', 'new-releases-title');
    upcomingMovieBoxTitle.textContent = 'Estrenos más esperados';        
    upcomingMovieBox.appendChild(upcomingMovieBoxTitle);

    const upcomingSlider = document.createElement('div');
    upcomingSlider.classList.add('feature-slider', 'feature-slider--primary');
    upcomingSlider.setAttribute('role', 'group');
    upcomingSlider.setAttribute('aria-roledescription', 'carrusel');
    upcomingSlider.setAttribute('aria-label', 'Estrenos más esperados');
    upcomingMovieBox.appendChild(upcomingSlider);

    const upcomingTrack = document.createElement('div');
    upcomingTrack.classList.add('feature-slider__track');
    upcomingSlider.appendChild(upcomingTrack);

    heroCards.length = 0;
    const topFive = upcomingMovies.slice(0, 5);
    topFive.forEach((movie) => {
        movie.buildUpcomingCard(heroCards, upcomingTrack, genres, setHeroArt, icon);
    });

    const upcomingMovieButtonsCarousel = document.createElement('div');
    upcomingMovieButtonsCarousel.classList.add('carousel-controls', 'feature-slider__controls');
    upcomingSlider.appendChild(upcomingMovieButtonsCarousel);

    const upcomingMovieButtonsCarouselPrev = document.createElement('button');
    upcomingMovieButtonsCarouselPrev.classList.add('carousel-arrow');
    upcomingMovieButtonsCarouselPrev.setAttribute('type', 'button');
    upcomingMovieButtonsCarouselPrev.setAttribute('data-hero', 'prev');
    upcomingMovieButtonsCarouselPrev.setAttribute('aria-label', 'Estreno anterior');
    upcomingMovieButtonsCarousel.appendChild(upcomingMovieButtonsCarouselPrev);

    const upcomingMovieButtonsCarouselPrevIcon = icon('arrow-left', 'carousel-arrow__icon');
    upcomingMovieButtonsCarouselPrev.appendChild(upcomingMovieButtonsCarouselPrevIcon);

    const upcomingMovieButtonsCarouselNext = document.createElement('button');
    upcomingMovieButtonsCarouselNext.classList.add('carousel-arrow');
    upcomingMovieButtonsCarouselNext.setAttribute('type', 'button');
    upcomingMovieButtonsCarouselNext.setAttribute('data-hero', 'next');
    upcomingMovieButtonsCarouselNext.setAttribute('aria-label', 'Siguiente estreno');
    upcomingMovieButtonsCarousel.appendChild(upcomingMovieButtonsCarouselNext);

    const upcomingMovieButtonsCarouselNextIcon = icon('arrow-right', 'carousel-arrow__icon');
    upcomingMovieButtonsCarouselNext.appendChild(upcomingMovieButtonsCarouselNextIcon);

    const newReleasesDots = document.createElement('div');
    newReleasesDots.classList.add('carousel-dots');
    newReleasesDots.setAttribute('id', 'hero-dots');
    newReleasesDots.setAttribute('role', 'group');
    newReleasesDots.setAttribute('aria-label', 'Secciones de nuevos estrenos');
    upcomingMovieBox.appendChild(newReleasesDots);

    setupSlider({
        slider: upcomingSlider,
        track: upcomingTrack,
        controls: upcomingMovieButtonsCarousel,
        prevButton: upcomingMovieButtonsCarouselPrev,
        nextButton: upcomingMovieButtonsCarouselNext,
        dotsContainer: newReleasesDots,
        dotLabel: 'Ir al estreno',
    });

    // Top rated
    const topRatedMovies = (await getTopRatedMovies()).results.map((movie) => Movie.fromResponse(movie));
    const topRated = document.createElement('section');
    topRated.classList.add('feature', 'feature--secondary');
    topRated.setAttribute('aria-labelledby', 'top-rated-title');
    heroRow.appendChild(topRated);

    const topRatedTitle = document.createElement('h2');
    topRatedTitle.classList.add('feature__title');
    topRatedTitle.setAttribute('id', 'top-rated-title');
    topRatedTitle.textContent = 'Mejor Valoradas';
    topRated.appendChild(topRatedTitle);

    const topRatedSlider = document.createElement('div');
    topRatedSlider.classList.add('feature-slider', 'feature-slider--compact');
    topRatedSlider.setAttribute('role', 'group');
    topRatedSlider.setAttribute('aria-roledescription', 'carrusel');
    topRatedSlider.setAttribute('aria-label', 'Mejor Valoradas');
    topRated.appendChild(topRatedSlider);

    const topRatedTrack = document.createElement('div');
    topRatedTrack.classList.add('feature-slider__track');
    topRatedSlider.appendChild(topRatedTrack);

    const topFiveRated = topRatedMovies.slice(0, 5);
    topFiveRated.forEach((movie) => {
        movie.buildRatedCard(heroCards, topRatedTrack, genres, setHeroArt, icon);
    });

    const topRatedControls = document.createElement('div');
    topRatedControls.classList.add('carousel-controls', 'feature-slider__controls');
    topRatedSlider.appendChild(topRatedControls);

    const topRatedPrev = document.createElement('button');
    topRatedPrev.classList.add('carousel-arrow');
    topRatedPrev.setAttribute('type', 'button');
    topRatedPrev.setAttribute('aria-label', 'Película anterior');
    topRatedControls.appendChild(topRatedPrev);
    topRatedPrev.appendChild(icon('arrow-left', 'carousel-arrow__icon'));

    const topRatedNext = document.createElement('button');
    topRatedNext.classList.add('carousel-arrow');
    topRatedNext.setAttribute('type', 'button');
    topRatedNext.setAttribute('aria-label', 'Siguiente película');
    topRatedControls.appendChild(topRatedNext);
    topRatedNext.appendChild(icon('arrow-right', 'carousel-arrow__icon'));

    const topRatedDots = document.createElement('div');
    topRatedDots.classList.add('carousel-dots');
    topRatedDots.setAttribute('role', 'group');
    topRatedDots.setAttribute('aria-label', 'Secciones de mejor valoradas');
    topRated.appendChild(topRatedDots);

    setupSlider({
        slider: topRatedSlider,
        track: topRatedTrack,
        controls: topRatedControls,
        prevButton: topRatedPrev,
        nextButton: topRatedNext,
        dotsContainer: topRatedDots,
        dotLabel: 'Ir a la película',
    });

    // Recommended
    buildMoviesList(main);
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
    if (query.length === 1) return;     // wait for at least 2 characters
    if (query === searchQuery) return;  // nothing changed (e.g. Enter after the debounce already ran)

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