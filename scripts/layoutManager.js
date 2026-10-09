const pages = [
    {
        title: 'Inicio',
        pageKey: 'home',
        icon: 'icon-home',
    },
    {
        title: 'Guardadas',
        pageKey: 'saved',
        icon: 'icon-bookmark',
    },
    {
        title: 'Series',
        pageKey: 'series',
        icon: 'icon-play',
    },
];


const printBasicLayout = (currentPage) => {
    const body = document.querySelector('body');

    const app = document.createElement('div');
    app.classList.add('app');
    body.appendChild(app);

    // Sidebar
    const sidebar = document.createElement('nav');
    sidebar.classList.add('sidebar');
    sidebar.setAttribute('aria-label', 'Main');
    app.appendChild(sidebar);

    const brand = document.createElement('a');
    brand.classList.add('sidebar__brand');
    brand.setAttribute('href', '#');
    sidebar.appendChild(brand);

    const logo = document.createElement('svg');
    logo.classList.add('sidebar__logo');
    logo.setAttribute('viewBox', '0 0 30 30');
    logo.setAttribute('aria-hidden', 'true');    

    const ring = document.createElement('circle');
    ring.classList.add('sidebar__logo-ring');
    ring.setAttribute('cx', '15');
    ring.setAttribute('cy', '15');
    ring.setAttribute('r', '14');
    logo.appendChild(ring);

    const play = document.createElement('path');
    play.classList.add('sidebar__logo-play');
    play.setAttribute('d', 'M12 9.5v11l9-5.5-9-5.5z');
    logo.appendChild(play);
    brand.appendChild(logo);

    const brandName = document.createElement('span');
    brandName.classList.add('sidebar__brand-name');
    brandName.textContent = 'Cinema Explorer';
    brand.appendChild(brandName);

    const nav = document.createElement('div');
    nav.classList.add('sidebar__nav');
    sidebar.appendChild(nav);

    pages.forEach((page) => {
        const navItem = document.createElement('a');
        navItem.classList.add('nav-item', 'nav-item--active');
        navItem.setAttribute('href', '#');
        if(page.pageKey === currentPage) {
            navItem.setAttribute('aria-current', 'page');
        }
        navItem.setAttribute('aria-label', page.title);
        nav.appendChild(navItem);

        const navItemIcon = document.createElement('svg');
        navItemIcon.classList.add('icon', 'nav-item__icon');
        navItemIcon.setAttribute('aria-hidden', 'true');
        navItemIcon.innerHTML = '<use href="#icon-' + page.icon + '"></use>';
        navItem.appendChild(navItemIcon);
        navItem.textContent = page.title;
        nav.appendChild(navItem);
    });

    const main = document.createElement('main');
    main.classList.add('main');
    app.appendChild(main);

    // Topbar
    const topbar = document.createElement('header');
    topbar.classList.add('topbar');
    main.appendChild(topbar);

    const search = document.createElement('label');
    search.classList.add('search');
    topbar.appendChild(search);

    const searchIcon = document.createElement('svg');
    searchIcon.classList.add('icon', 'search__icon');
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.innerHTML = '<use href="#icon-search"></use>';
    search.appendChild(searchIcon);

    const searchInput = document.createElement('input');
    searchInput.classList.add('search__input');
    searchInput.setAttribute('id', 'search-input');
    searchInput.setAttribute('type', 'search');
    searchInput.setAttribute('placeholder', 'Busca por títulos, personas, géneros...');
    searchInput.setAttribute('aria-label', 'Busca por títulos, personas, géneros...');
    searchInput.setAttribute('autocomplete', 'off');
    search.appendChild(searchInput);

    const searchButton = document.createElement('button');
    searchButton.classList.add('icon-button');
    searchButton.setAttribute('type', 'button');
    searchButton.setAttribute('aria-label', 'Notificaciones, 1 no leído');
    search.appendChild(searchButton);

    const searchButtonIcon = document.createElement('svg');
    searchButtonIcon.classList.add('icon');
    searchButtonIcon.setAttribute('aria-hidden', 'true');
    searchButtonIcon.innerHTML = '<use href="#icon-bell"></use>';
    searchButton.appendChild(searchButtonIcon);

    const searchButtonBadge = document.createElement('span');
    searchButtonBadge.classList.add('icon-button__badge');
    searchButton.appendChild(searchButtonBadge);

    // Topbar
    const heroRow = document.createElement('div');
    heroRow.classList.add('hero-row');
    main.appendChild(heroRow);

    // New releases
    const newReleases = document.createElement('section');
    newReleases.classList.add('feature', 'feature--primary');
    newReleases.setAttribute('aria-labelledby', 'new-releases-title');
    heroRow.appendChild(newReleases);

    const newReleasesTitle = document.createElement('h2');
    newReleasesTitle.classList.add('feature__title');
    newReleasesTitle.setAttribute('id', 'new-releases-title');
    newReleasesTitle.textContent = 'Las más nuevas';        
    newReleases.appendChild(newReleasesTitle);

    const newReleasesCard = document.createElement('div');
    newReleasesCard.classList.add('feature-card');
    newReleasesCard.setAttribute('id', 'hero-card');
    newReleases.appendChild(newReleasesCard);

    const newReleasesCardScrim = document.createElement('div');
    newReleasesCardScrim.classList.add('feature-card__scrim');
    newReleasesCard.appendChild(newReleasesCardScrim);

    const newReleasesCardContent = document.createElement('div');
    newReleasesCardContent.classList.add('feature-card__content');
    newReleasesCard.appendChild(newReleasesCardContent);

    const newReleasesCardTitle = document.createElement('h3');
    newReleasesCardTitle.classList.add('tag-list');
    newReleasesCardTitle.setAttribute('id', 'hero-tags');        
    newReleasesCardContent.appendChild(newReleasesCardTitle);

    const newReleasesCardDesc = document.createElement('p');
    newReleasesCardDesc.classList.add('feature-card__desc');
    newReleasesCardDesc.setAttribute('id', 'hero-desc');
    newReleasesCardContent.appendChild(newReleasesCardDesc);

    const newReleasesCardActions = document.createElement('div');
    newReleasesCardActions.classList.add('feature-card__actions');
    newReleasesCard.appendChild(newReleasesCardActions);

    const newReleasesCardButtons = document.createElement('div');
    newReleasesCardButtons.classList.add('feature-card__buttons');
    newReleasesCardActions.appendChild(newReleasesCardButtons);                        

    const newReleasesCardButtonsPlay = document.createElement('button');
    newReleasesCardButtonsPlay.classList.add('btn', 'btn--primary');
    newReleasesCardButtonsPlay.setAttribute('type', 'button');
    newReleasesCardButtonsPlay.innerHTML = '<svg class="icon icon--filled btn__icon" aria-hidden="true"><use href="#icon-play-wide"></use></svg>Más detalles';
    newReleasesCardButtons.appendChild(newReleasesCardButtonsPlay);

    const newReleasesCardButtonsCarousel = document.createElement('div');
    newReleasesCardButtonsCarousel.classList.add('carousel-controls');
    newReleasesCardButtons.appendChild(newReleasesCardButtonsCarousel);

    const newReleasesCardButtonsCarouselPrev = document.createElement('button');
    newReleasesCardButtonsCarouselPrev.classList.add('carousel-arrow');
    newReleasesCardButtonsCarouselPrev.setAttribute('type', 'button');
    newReleasesCardButtonsCarouselPrev.setAttribute('data-hero', 'prev');
    newReleasesCardButtonsCarouselPrev.setAttribute('aria-label', 'Previous release');
    newReleasesCardButtonsCarousel.appendChild(newReleasesCardButtonsCarouselPrev);

    const newReleasesCardButtonsCarouselNext = document.createElement('button');
    newReleasesCardButtonsCarouselNext.classList.add('carousel-arrow');
    newReleasesCardButtonsCarouselNext.setAttribute('type', 'button');
    newReleasesCardButtonsCarouselNext.setAttribute('data-hero', 'next');
    newReleasesCardButtonsCarouselNext.setAttribute('aria-label', 'Next release');
    newReleasesCardButtonsCarousel.appendChild(newReleasesCardButtonsCarouselNext);

    const newReleasesDots = document.createElement('div');
    newReleasesDots.classList.add('carousel-dots');
    newReleasesDots.setAttribute('id', 'hero-dots');
    newReleasesDots.setAttribute('role', 'group');
    newReleasesDots.setAttribute('aria-label', 'New releases pages');
    newReleasesCard.appendChild(newReleasesDots);

    const newReleasesDotsButton = document.createElement('button');
    newReleasesDotsButton.classList.add('carousel-dot', 'is-active');
    newReleasesDotsButton.setAttribute('type', 'button');
    newReleasesDotsButton.setAttribute('aria-label', 'Go to release 1');
    newReleasesDotsButton.setAttribute('aria-current', 'true');
    newReleasesDots.appendChild(newReleasesDotsButton);

    const newReleasesDotsButton2 = document.createElement('button');
    newReleasesDotsButton2.classList.add('carousel-dot');
    newReleasesDotsButton2.setAttribute('type', 'button');
    newReleasesDotsButton2.setAttribute('aria-label', 'Go to release 2');
    newReleasesDots.appendChild(newReleasesDotsButton2);

    const newReleasesDotsButton3 = document.createElement('button');
    newReleasesDotsButton3.classList.add('carousel-dot');
    newReleasesDotsButton3.setAttribute('type', 'button');
    newReleasesDotsButton3.setAttribute('aria-label', 'Go to release 3');
    newReleasesDots.appendChild(newReleasesDotsButton3);

    const newReleasesDotsButton4 = document.createElement('button');
    newReleasesDotsButton4.classList.add('carousel-dot');
    newReleasesDotsButton4.setAttribute('type', 'button');
    newReleasesDotsButton4.setAttribute('aria-label', 'Go to release 4');
    newReleasesDots.appendChild(newReleasesDotsButton4);

    // Top rated
    const topRated = document.createElement('section');
    topRated.classList.add('feature', 'feature--secondary');
    topRated.setAttribute('aria-labelledby', 'top-rated-title');
    heroRow.appendChild(topRated);

    const topRatedTitle = document.createElement('h2');
    topRatedTitle.classList.add('feature__title');
    topRatedTitle.setAttribute('id', 'top-rated-title');
    topRatedTitle.textContent = 'Mejor Valoradas';
    topRated.appendChild(topRatedTitle);

    const topRatedCard = document.createElement('div');
    topRatedCard.classList.add('feature-card', 'feature-card--compact');
    topRatedCard.setAttribute('id', 'top-card');
    topRated.appendChild(topRatedCard);

    const topRatedCardScrim = document.createElement('div');
    topRatedCardScrim.classList.add('feature-card__scrim');
    topRatedCard.appendChild(topRatedCardScrim);

    const topRatedCardContent = document.createElement('div');
    topRatedCardContent.classList.add('feature-card__content');
    topRatedCard.appendChild(topRatedCardContent);

    const topRatedCardTitle = document.createElement('h3');
    topRatedCardTitle.classList.add('tag-list');
    topRatedCardTitle.setAttribute('id', 'top-tags');
    topRatedCardContent.appendChild(topRatedCardTitle);

    const topRatedCardDesc = document.createElement('p');
    topRatedCardDesc.classList.add('feature-card__desc');
    topRatedCardDesc.setAttribute('id', 'top-desc');
    topRatedCardContent.appendChild(topRatedCardDesc);

    const topRatedCardActions = document.createElement('div');
    topRatedCardActions.classList.add('feature-card__actions');
    topRatedCard.appendChild(topRatedCardActions);

    const topRatedCardButtons = document.createElement('div');
    topRatedCardButtons.classList.add('feature-card__buttons');
    topRatedCardActions.appendChild(topRatedCardButtons);

    const topRatedCardButtonsPlay = document.createElement('button');
    topRatedCardButtonsPlay.classList.add('play-button', 'play-button--accent');
    topRatedCardButtonsPlay.setAttribute('id', 'top-play');
    topRatedCardButtonsPlay.setAttribute('type', 'button');
    topRatedCardButtonsPlay.setAttribute('aria-label', 'Play Low Tide Club');
    topRatedCardButtons.appendChild(topRatedCardButtonsPlay);

    const topRatedCardButtonsCarousel = document.createElement('div');
    topRatedCardButtonsCarousel.classList.add('carousel-controls');
    topRatedCardButtons.appendChild(topRatedCardButtonsCarousel);

    const topRatedCardButtonsCarouselPrev = document.createElement('button');
    topRatedCardButtonsCarouselPrev.classList.add('carousel-arrow');
    topRatedCardButtonsCarouselPrev.setAttribute('type', 'button');
    topRatedCardButtonsCarouselPrev.setAttribute('data-top', 'prev');
    topRatedCardButtonsCarouselPrev.setAttribute('aria-label', 'Previous top rated');
    topRatedCardButtonsCarousel.appendChild(topRatedCardButtonsCarouselPrev);

    const topRatedCardButtonsCarouselNext = document.createElement('button');
    topRatedCardButtonsCarouselNext.classList.add('carousel-arrow');
    topRatedCardButtonsCarouselNext.setAttribute('type', 'button');
    topRatedCardButtonsCarouselNext.setAttribute('data-top', 'next');
    topRatedCardButtonsCarouselNext.setAttribute('aria-label', 'Next top rated');
    topRatedCardButtonsCarousel.appendChild(topRatedCardButtonsCarouselNext);

    const topRatedDots = document.createElement('div');
    topRatedDots.classList.add('carousel-dots');
    topRatedDots.setAttribute('id', 'top-dots');
    topRatedDots.setAttribute('role', 'group');
    topRatedDots.setAttribute('aria-label', 'Top rated pages');
    topRatedCard.appendChild(topRatedDots);

    const topRatedDotsButton = document.createElement('button');
    topRatedDotsButton.classList.add('carousel-dot', 'is-active');
    topRatedDotsButton.setAttribute('type', 'button');
    topRatedDotsButton.setAttribute('aria-label', 'Go to top rated 1');
    topRatedDotsButton.setAttribute('aria-current', 'true');
    topRatedDots.appendChild(topRatedDotsButton);

    const topRatedDotsButton2 = document.createElement('button');
    topRatedDotsButton2.classList.add('carousel-dot');
    topRatedDotsButton2.setAttribute('type', 'button');
    topRatedDotsButton2.setAttribute('aria-label', 'Go to top rated 2');
    topRatedDots.appendChild(topRatedDotsButton2);

    const topRatedDotsButton3 = document.createElement('button');
    topRatedDotsButton3.classList.add('carousel-dot');
    topRatedDotsButton3.setAttribute('type', 'button');
    topRatedDotsButton3.setAttribute('aria-label', 'Go to top rated 3');
    topRatedDots.appendChild(topRatedDotsButton3);

    const topRatedDotsButton4 = document.createElement('button');
    topRatedDotsButton4.classList.add('carousel-dot');
    topRatedDotsButton4.setAttribute('type', 'button');
    topRatedDotsButton4.setAttribute('aria-label', 'Go to top rated 4');
    topRatedDots.appendChild(topRatedDotsButton4);  

    // Recommended
    const recommended = document.createElement('section');
    recommended.classList.add('recommended');
    recommended.setAttribute('aria-labelledby', 'recommended-title');
    heroRow.appendChild(recommended);

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

function appendContent() {
  console.log("Hello World");
}

export { printBasicLayout, appendContent };