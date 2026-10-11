import { getUpcomingMovies, getGenres, getTopRatedMovies } from './data/apiLoader.js';
import { getHeroImageUrl } from './utils.js';
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

// DOM
const app = document.querySelector('body');
let main = null;
const heroCards = [];
let resizeTimer = null;
let themeIcon = null;
let themeButton = null;

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

    loadTheme();
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
    genres = await getGenres();
    // Topbar
    const topbar = document.createElement('header');
    topbar.classList.add('topbar');
    main.appendChild(topbar);

    const search = document.createElement('label');
    search.classList.add('search');
    topbar.appendChild(search);

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

    const lightModeButton = document.createElement('button');
    lightModeButton.classList.add('icon-button');
    lightModeButton.setAttribute('type', 'button');
    lightModeButton.setAttribute('aria-label', 'Modo Oscuro/Claro');
    topbar.appendChild(lightModeButton);

    const lightModeButtonIcon = icon('sun', 'icon');
    lightModeButton.appendChild(lightModeButtonIcon);

    themeIcon = lightModeButtonIcon;
    themeButton = lightModeButton;
    renderThemeButton();
    applyTheme(theme);

    lightModeButton.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark', true));

    // Topbar
    const heroRow = document.createElement('div');
    heroRow.classList.add('hero-row');
    main.appendChild(heroRow);

    // New releases    
    const upcomingMovies = await getUpcomingMovies();

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
    const topFive = upcomingMovies.results.slice(0, 5);
    topFive.forEach((movie) => {
        const upcomingMovieCard = document.createElement('div');
        upcomingMovieCard.classList.add('feature-card');

        const upcomingMovieCardScrim = document.createElement('div');
        upcomingMovieCardScrim.classList.add('feature-card__scrim');
        upcomingMovieCard.appendChild(upcomingMovieCardScrim);

        const upcomingMovieCardContent = document.createElement('div');
        upcomingMovieCardContent.classList.add('feature-card__content');
        upcomingMovieCard.appendChild(upcomingMovieCardContent);

        const upcomingMovieTag = document.createElement('div');
        upcomingMovieTag.classList.add('tag-list');
        upcomingMovieCardContent.appendChild(upcomingMovieTag);

        movie.genre_ids.forEach((genreId) => {
            const genre = genres.find((genre) => genre.id === genreId);
            if (genre) {
                const tagItem = document.createElement('span');
                tagItem.classList.add('tag');
                tagItem.textContent = genre.name;
                upcomingMovieTag.appendChild(tagItem);              
            } 
        });

        const upcomingMovieTitle = document.createElement('h3');
        upcomingMovieTitle.classList.add('feature-card__title');
        upcomingMovieTitle.textContent = movie.title;
        upcomingMovieCardContent.appendChild(upcomingMovieTitle);

        const upcomingMovieDesc = document.createElement('p');
        upcomingMovieDesc.classList.add('feature-card__desc');
        upcomingMovieDesc.textContent = movie.overview;
        upcomingMovieCardContent.appendChild(upcomingMovieDesc);

        const upcomingMovieActions = document.createElement('div');
        upcomingMovieActions.classList.add('feature-card__actions');
        upcomingMovieCardContent.appendChild(upcomingMovieActions);

        const upcomingMovieButtons = document.createElement('div');
        upcomingMovieButtons.classList.add('feature-card__buttons');
        upcomingMovieActions.appendChild(upcomingMovieButtons);                        

        const upcomingMovieButtonsRelease = document.createElement('button');
        upcomingMovieButtonsRelease.classList.add('btn', 'btn--primary');
        upcomingMovieButtonsRelease.setAttribute('type', 'button');
        upcomingMovieButtonsRelease.setAttribute('aria-label', 'Ver el estreno');
        upcomingMovieButtons.appendChild(upcomingMovieButtonsRelease);

        const upcomingMovieButtonsReleaseIcon = icon('play-wide', 'icon--filled btn__icon');
        upcomingMovieButtonsRelease.appendChild(upcomingMovieButtonsReleaseIcon);

        const upcomingMovieButtonsReleaseText = document.createElement('span');
        upcomingMovieButtonsReleaseText.textContent = movie.release_date;
        upcomingMovieButtonsRelease.appendChild(upcomingMovieButtonsReleaseText);

        const upcomingMovieButtonsDetails = document.createElement('button');
        upcomingMovieButtonsDetails.classList.add('btn', 'btn--icon');
        upcomingMovieButtonsDetails.setAttribute('type', 'button');
        upcomingMovieButtonsDetails.setAttribute('aria-label', 'Más información');

        const upcomingMovieButtonsDetailsIcon = icon('more', 'icon--filled btn__icon');
        upcomingMovieButtonsDetails.appendChild(upcomingMovieButtonsDetailsIcon);
        upcomingMovieButtons.appendChild(upcomingMovieButtonsDetails);

        heroCards.push({ card: upcomingMovieCard, movie });
        setHeroArt(upcomingMovieCard, movie);
        upcomingTrack.appendChild(upcomingMovieCard);
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
    const topRatedMovies = await getTopRatedMovies();
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

    const topFiveRated = topRatedMovies.results.slice(0, 5);
    topFiveRated.forEach((movie) => {
        const topRatedCard = document.createElement('div');
        topRatedCard.classList.add('feature-card', 'feature-card--compact');

        const topRatedCardScrim = document.createElement('div');
        topRatedCardScrim.classList.add('feature-card__scrim');
        topRatedCard.appendChild(topRatedCardScrim);

        const topRatedCardContent = document.createElement('div');
        topRatedCardContent.classList.add('feature-card__content');
        topRatedCard.appendChild(topRatedCardContent);

        const topRatedCardTags = document.createElement('div');
        topRatedCardTags.classList.add('tag-list');
        topRatedCardContent.appendChild(topRatedCardTags);

        for (const tag of movie.genre_ids) {
            const genre = genres.find((genre) => genre.id === tag);
            if (!genre) continue; 
            const tagItem = document.createElement('span');
            tagItem.classList.add('tag');
            tagItem.textContent = genre.name;
            topRatedCardTags.appendChild(tagItem);
        }

        const tagScore = document.createElement('span');
        tagScore.classList.add('tag', 'tag--rating');
        topRatedCardTags.appendChild(tagScore);

        const tagScoreIcon = icon('star', 'tag__star');
        tagScore.appendChild(tagScoreIcon);

        const tagScoreText = document.createElement('span');
        tagScoreText.textContent = movie.vote_average.toFixed(1);
        tagScore.appendChild(tagScoreText);

        const topRatedCardTitle = document.createElement('h3');
        topRatedCardTitle.classList.add('feature-card__title');
        topRatedCardTitle.textContent = movie.title;
        topRatedCardContent.appendChild(topRatedCardTitle);

        const topRatedCardDesc = document.createElement('p');
        topRatedCardDesc.classList.add('feature-card__desc');
        topRatedCardDesc.textContent = movie.overview;
        topRatedCardContent.appendChild(topRatedCardDesc);        

        const topRatedCardActions = document.createElement('div');
        topRatedCardActions.classList.add('feature-card__actions');
        topRatedCardContent.appendChild(topRatedCardActions);

        const topRatedCardButtons = document.createElement('div');
        topRatedCardButtons.classList.add('feature-card__buttons');
        topRatedCardActions.appendChild(topRatedCardButtons);    

        const topRatedCardButtonsDetails = document.createElement('button');
        topRatedCardButtonsDetails.classList.add('btn', 'btn--icon');
        topRatedCardButtonsDetails.setAttribute('type', 'button');
        topRatedCardButtonsDetails.setAttribute('aria-label', 'Más información');
        topRatedCardButtons.appendChild(topRatedCardButtonsDetails);

        const topRatedCardButtonsDetailsIcon = icon('more', 'icon--filled btn__icon');
        topRatedCardButtonsDetails.appendChild(topRatedCardButtonsDetailsIcon);
        topRatedCardButtons.appendChild(topRatedCardButtonsDetails);

        heroCards.push({ card: topRatedCard, movie });
        setHeroArt(topRatedCard, movie);
        topRatedTrack.appendChild(topRatedCard);
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
    const recommended = document.createElement('section');
    recommended.classList.add('recommended');
    recommended.setAttribute('aria-labelledby', 'recommended-title');
    main.appendChild(recommended);

    const recommendedHeader = document.createElement('div');
    recommendedHeader.classList.add('recommended__header');
    recommended.appendChild(recommendedHeader);

    const recommendedTitle = document.createElement('h2');
    recommendedTitle.classList.add('recommended__title');
    recommendedTitle.setAttribute('id', 'recommended-title');
    recommendedTitle.textContent = 'Lo más popular';
    recommended.appendChild(recommendedTitle);

    const recommendedChips = document.createElement('div');
    recommendedChips.classList.add('chips');
    recommendedChips.setAttribute('id', 'genre-chips');
    recommendedChips.setAttribute('role', 'group');
    recommendedChips.setAttribute('aria-label', 'Filter by genre');
    recommended.appendChild(recommendedChips);

    const recommendedChipsButton = document.createElement('button');
    recommendedChipsButton.classList.add('chip', 'is-active');
    recommendedChipsButton.setAttribute('type', 'button');
    recommendedChipsButton.setAttribute('data-genre', 'All');
    recommendedChipsButton.setAttribute('aria-pressed', 'true');
    recommendedChipsButton.textContent = 'Todo';
    recommendedChips.appendChild(recommendedChipsButton);

    const recommendedChipsButton2 = document.createElement('button');
    recommendedChipsButton2.classList.add('chip');
    recommendedChipsButton2.setAttribute('type', 'button');
    recommendedChipsButton2.setAttribute('data-genre', 'Comedy');
    recommendedChipsButton2.setAttribute('aria-pressed', 'false');
    recommendedChipsButton2.textContent = 'Genero 1';
    recommendedChips.appendChild(recommendedChipsButton2);

    const recommendedChipsButton3 = document.createElement('button');
    recommendedChipsButton3.classList.add('chip');
    recommendedChipsButton3.setAttribute('type', 'button');
    recommendedChipsButton3.setAttribute('data-genre', 'Action');
    recommendedChipsButton3.setAttribute('aria-pressed', 'false');
    recommendedChipsButton3.textContent = 'Genero 2';
    recommendedChips.appendChild(recommendedChipsButton3);

    const recommendedChipsButton4 = document.createElement('button');
    recommendedChipsButton4.classList.add('chip');
    recommendedChipsButton4.setAttribute('type', 'button');
    recommendedChipsButton4.setAttribute('data-genre', 'Horror');
    recommendedChipsButton4.setAttribute('aria-pressed', 'false');
    recommendedChipsButton4.textContent = 'Genero 3';
    recommendedChips.appendChild(recommendedChipsButton4);

    const recommendedChipsButton5 = document.createElement('button');
    recommendedChipsButton5.classList.add('chip');
    recommendedChipsButton5.setAttribute('type', 'button');
    recommendedChipsButton5.setAttribute('data-genre', 'Drama');
    recommendedChipsButton5.setAttribute('aria-pressed', 'false');
    recommendedChipsButton5.textContent = 'Genero 4';
    recommendedChips.appendChild(recommendedChipsButton5);

    const recommendedChipsButton6 = document.createElement('button');
    recommendedChipsButton6.classList.add('chip');
    recommendedChipsButton6.setAttribute('type', 'button');
    recommendedChipsButton6.setAttribute('data-genre', 'Animation');
    recommendedChipsButton6.setAttribute('aria-pressed', 'false');
    recommendedChipsButton6.textContent = 'Genero 5';
    recommendedChips.appendChild(recommendedChipsButton6);

    const recommendedChipsButton7 = document.createElement('button');
    recommendedChipsButton7.classList.add('btn', 'btn--soft');
    recommendedChipsButton7.setAttribute('id', 'see-all');
    recommendedChipsButton7.setAttribute('type', 'button');
    recommendedChipsButton7.setAttribute('aria-pressed', 'false');
    recommendedChipsButton7.textContent = 'Ver más';
    recommendedChips.appendChild(recommendedChipsButton7);

    const recommendedMovieGrid = document.createElement('div');
    recommendedMovieGrid.classList.add('movie-grid');
    recommendedMovieGrid.setAttribute('id', 'movie-grid');
    recommended.appendChild(recommendedMovieGrid);

    const recommendedEmptyState = document.createElement('p');
    recommendedEmptyState.classList.add('empty-state');
    recommendedEmptyState.setAttribute('id', 'empty-state');
    recommendedEmptyState.hidden = true;    
    recommended.appendChild(recommendedEmptyState); 
}

function setupSlider({ slider, track, controls, prevButton, nextButton, dotsContainer, dotLabel }) {
    const slides = [...track.children];
    let current = 0;

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
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === current);
            if (i === current) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
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