/* Lumen — home screen
   ---------------------------------------------------------------------------
   index.html only holds the icon sprite. Everything else is built here as DOM
   nodes, so every element can be reached and rearranged from JavaScript.

   Class names are the same ones style.css already styles (BEM), so nothing in
   the stylesheet depends on how the nodes get created.

   After load, `window.Lumen` exposes:
     Lumen.ui       every important element, by name (see the `ui` object)
     Lumen.state    the current UI state
     Lumen.data     newReleases, topRated, movies
     Lumen.build    the component builders (each returns a new element)
     Lumen.render   the render functions (call after changing state or data)
     Lumen.mount    (parent = document.body) puts the app into the page
   --------------------------------------------------------------------------- */

(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------
     DOM helpers
     ------------------------------------------------------------------ */

  // Applies a plain attributes object to an element.
  //   text     -> textContent
  //   hidden   -> the hidden property
  //   onClick  -> addEventListener('click', fn)   (any on<Event> works)
  //   null / undefined / false values are skipped
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

  // h('div', { class: 'foo' }, child, 'text', [more, children])
  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
  }

  // Same as h(), for SVG elements.
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
  }

  // <svg class="icon ..."><use href="#icon-NAME"/></svg>, symbols live in index.html.
  function icon(name, classes = '') {
    return svg(
      'svg',
      { class: `icon ${classes}`.trim(), 'aria-hidden': 'true' },
      svg('use', { href: `#icon-${name}` })
    );
  }

  /* ------------------------------------------------------------------
     Key art
     Placeholder artwork built from CSS gradients (sky, sun, then a
     skyline / hills / sea). Replace the `art` values with
     `url(path/to/poster.jpg) center / cover` once you have real images.
     ------------------------------------------------------------------ */
  function scene(kind, skyTop, skyMid, skyLow, sunX, sunY, seed) {
    const layers = [];

    if (kind === 'city') {
      const buildings = 14;
      for (let i = 0; i < buildings; i++) {
        const height = 16 + ((seed * 13 + i * 37 + (i % 3) * 11) % 34);
        const width = 100 / buildings + 1.2;
        const x = (i / (buildings - 1)) * 100;
        layers.push(`linear-gradient(#06070B, #06070B) ${x}% 100% / ${width}% ${height}% no-repeat`);
      }
    }

    if (kind === 'hills') {
      layers.push('radial-gradient(70% 38% at 25% 108%, #06070B 98%, transparent 100%)');
      layers.push('radial-gradient(80% 30% at 85% 112%, #0A0C12 98%, transparent 100%)');
    }

    if (kind === 'sea') {
      layers.push('repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 9px) 0 100% / 100% 26% no-repeat');
      layers.push('linear-gradient(0deg, rgba(4,6,10,0.8), rgba(4,6,10,0.35)) 0 100% / 100% 26% no-repeat');
    }

    layers.push(`radial-gradient(circle at ${sunX}% ${sunY}%, #FFF3D6 0 3.5%, rgba(255,214,150,0.45) 4% 9%, transparent 22%)`);
    layers.push(`linear-gradient(180deg, ${skyTop} 0%, ${skyMid} 62%, ${skyLow} 100%)`);
    return layers.join(', ');
  }

  /* ------------------------------------------------------------------
     Data
     ------------------------------------------------------------------ */
  const newReleases = [
    {
      title: 'Neon Meridian',
      tags: ['Sci-fi', 'Action'],
      desc: 'A courier racing across a flooded megacity learns the package she carries is a map back to the night the lights went out.',
      art: scene('city', '#1B2A6B', '#7A3FB8', '#FF8A5B', 72, 38, 3),
    },
    {
      title: 'Paper Moons',
      tags: ['Drama', 'Romance'],
      desc: 'Two strangers keep missing each other across one long summer, leaving notes folded into the pages of a lending library.',
      art: scene('hills', '#0F2B3D', '#2E6E8E', '#F4C27A', 28, 34, 5),
    },
    {
      title: 'Orbit Street',
      tags: ['Animation', 'Adventure'],
      desc: 'When the neighbourhood gets lifted into orbit overnight, a delivery kid has one shift to bring everyone home.',
      art: scene('city', '#3B1D6E', '#D4507A', '#FFC36B', 20, 30, 8),
    },
    {
      title: 'The Last Cartographer',
      tags: ['Adventure', 'Mystery'],
      desc: 'A retired mapmaker is hired to chart an island that appears on no sea chart, and disappears at low tide.',
      art: scene('sea', '#0E3B35', '#2FA58A', '#F0E2A0', 66, 36, 2),
    },
  ];

  const topRated = [
    {
      title: 'Low Tide Club', genre: 'Comedy', score: '9.1',
      desc: 'Five retirees, one failing seaside lido and a plan to save it that gets out of hand almost immediately.',
      art: scene('sea', '#20315E', '#C9677A', '#FFD08A', 70, 40, 4),
    },
    {
      title: 'Velvet Circuit', genre: 'Thriller', score: '8.9',
      desc: 'An engineer inside a city-wide racing syndicate starts to suspect the finish line was never the point.',
      art: scene('city', '#2A0E3F', '#8A2D6B', '#FF7A59', 36, 32, 6),
    },
    {
      title: 'Quiet Engines', genre: 'Documentary', score: '8.8',
      desc: 'A year inside the last workshop in the country that still builds steam locomotives by hand.',
      art: scene('hills', '#2B2A33', '#8C6B58', '#F2B97B', 74, 30, 9),
    },
    {
      title: 'Northbound', genre: 'Crime', score: '8.7',
      desc: 'A night train, a stolen ledger and a detective who has to solve it before the last station.',
      art: scene('hills', '#0A1530', '#2A4A8F', '#9CC4FF', 24, 28, 1),
    },
  ];

  // [title, genre, description, scene kind, sky top, sky mid, sky low, sun x, sun y, seed]
  const movies = [
    ['Sunday Roast', 'Comedy', 'Three generations, one oven and a family dinner that refuses to stay civil.', 'hills', '#4A2A12', '#C8782E', '#FFCB6B', 30, 32, 11],
    ['Redline Harbor', 'Action', 'A salvage crew has twelve minutes to cross a harbour that is about to close.', 'sea', '#13203F', '#3F63B5', '#FF9E6B', 70, 36, 12],
    ['Hollow Season', 'Horror', 'The cabins empty out every autumn. This year somebody stays behind.', 'hills', '#1A0E1E', '#5B2A55', '#B86A6A', 62, 26, 13],
    ['Glass Orchard', 'Drama', 'A widow, an heirloom orchard and a neighbour who keeps offering to buy it.', 'hills', '#1D3322', '#4E8C58', '#E8E29A', 26, 34, 14],
    ['Nine Lanterns', 'Animation', 'A paper-lantern maker follows the one that drifts away to a city built in the clouds.', 'city', '#33195E', '#B2468E', '#FFB86B', 70, 30, 15],
    ['Backstage Pass', 'Comedy', 'A touring crew accidentally becomes the headline act of a festival nobody planned.', 'city', '#12313F', '#2E8BA5', '#FFDF8A', 24, 36, 16],
    ['Iron Weather', 'Action', 'Storm chasers get stuck between a hurricane and the people who want its data.', 'sea', '#1A1F2E', '#56607A', '#E6C58E', 52, 28, 17],
    ['The Lantern Room', 'Horror', 'A lighthouse keeper logs every night. One entry in the log is not in his handwriting.', 'sea', '#0B1220', '#27405E', '#9DB8D6', 34, 24, 18],
    ['Static Garden', 'Animation', 'A robot gardener keeps a greenhouse alive long after the last human has left the station.', 'hills', '#0F3A33', '#3FB59A', '#F5F0A8', 72, 34, 19],
    ['Paper Lanterns', 'Drama', 'Two sisters reopen their late father’s cinema for a single, complicated season.', 'city', '#3A1C2E', '#B5516B', '#FFC48A', 40, 30, 20],
    ['Pocket Kingdom', 'Animation', 'The smallest country on the map has one border guard, one lighthouse and one huge secret.', 'hills', '#2B1A5C', '#6E56E0', '#FFD3F0', 68, 32, 21],
    ['Stonefall', 'Action', 'A rescue pilot has one night to reach a mountain village before the pass closes.', 'hills', '#1E2230', '#6B7592', '#F0D7B4', 30, 30, 22],
  ].map(([title, genre, desc, kind, top, mid, low, sunX, sunY, seed]) => ({
    title,
    genre,
    desc,
    art: scene(kind, top, mid, low, sunX, sunY, seed),
  }));

  const genres = ['All', 'Comedy', 'Action', 'Horror', 'Drama', 'Animation'];

  const primaryNav = [
    { label: 'Home', icon: 'home', active: true },
    { label: 'Bookmarks', icon: 'bookmark' },
    { label: 'Downloads', icon: 'download' },
    { label: 'Profile', icon: 'user' },
  ];

  const secondaryNav = [
    { label: 'Settings', icon: 'settings' },
    { label: 'Help', icon: 'help' },
    { label: 'Log out', icon: 'logout' },
  ];

  const PREVIEW_COUNT = 4;

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  const state = {
    heroIndex: 0,
    topIndex: 0,
    genre: 'All',
    query: '',
    showAll: false,
    bookmarked: new Set(),
  };

  /* ------------------------------------------------------------------
     Element registry
     Every builder below stores the nodes you are most likely to touch here.
     ------------------------------------------------------------------ */
  const ui = {};

  const wrap = (index, length) => (index + length) % length;

  /* ------------------------------------------------------------------
     Shared components
     ------------------------------------------------------------------ */
  function buildArrowButton(direction, label, onClick) {
    return h(
      'button',
      { class: 'carousel-arrow', type: 'button', 'aria-label': label, onClick },
      icon(`arrow-${direction}`, 'carousel-arrow__icon')
    );
  }

  function buildCarouselDots({ id, label, itemLabel, count, onPick }) {
    const dots = Array.from({ length: count }, (_, index) =>
      h('button', {
        class: 'carousel-dot',
        type: 'button',
        'aria-label': `${itemLabel} ${index + 1}`,
        onClick: () => onPick(index),
      })
    );
    return h('div', { class: 'carousel-dots', id, role: 'group', 'aria-label': label }, dots);
  }

  function setActiveDot(container, activeIndex) {
    [...container.children].forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  /* ------------------------------------------------------------------
     Sidebar
     ------------------------------------------------------------------ */
  function buildNavItem({ label, icon: iconName, active }) {
    return h(
      'a',
      {
        class: active ? 'nav-item nav-item--active' : 'nav-item',
        href: '#',
        'aria-current': active ? 'page' : null,
      },
      icon(iconName, 'nav-item__icon'),
      label
    );
  }

  function buildSidebar() {
    const logo = svg(
      'svg',
      { class: 'sidebar__logo', viewBox: '0 0 30 30', 'aria-hidden': 'true' },
      svg('circle', { class: 'sidebar__logo-ring', cx: 15, cy: 15, r: 14 }),
      svg('path', { class: 'sidebar__logo-play', d: 'M12 9.5v11l9-5.5-9-5.5z' })
    );

    const brand = h(
      'a',
      { class: 'sidebar__brand', href: '#' },
      logo,
      h('span', { class: 'sidebar__brand-name', text: 'LUMEN' })
    );

    const primary = h('div', { class: 'sidebar__nav' }, primaryNav.map(buildNavItem));
    const secondary = h(
      'div',
      { class: 'sidebar__nav sidebar__nav--secondary' },
      secondaryNav.map(buildNavItem)
    );

    ui.sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Main' }, brand, primary, secondary);
    ui.brand = brand;
    ui.primaryNav = primary;
    ui.secondaryNav = secondary;
    return ui.sidebar;
  }

  /* ------------------------------------------------------------------
     Top bar
     ------------------------------------------------------------------ */
  function buildTopbar() {
    ui.searchInput = h('input', {
      class: 'search__input',
      id: 'search-input',
      type: 'search',
      placeholder: 'Search titles, people, genres',
      'aria-label': 'Search titles, people, genres',
      autocomplete: 'off',
      onInput: () => {
        state.query = ui.searchInput.value;
        renderMovies();
      },
    });

    ui.search = h(
      'label',
      { class: 'search' },
      icon('search', 'search__icon'),
      ui.searchInput
    );

    ui.notifications = h(
      'button',
      { class: 'icon-button', type: 'button', 'aria-label': 'Notifications, 1 unread' },
      icon('bell'),
      h('span', { class: 'icon-button__badge' })
    );

    ui.account = h(
      'button',
      { class: 'account', type: 'button', 'aria-label': 'Account menu' },
      h('span', { class: 'account__avatar', text: 'AR' }),
      h(
        'span',
        { class: 'account__info' },
        h('span', { class: 'account__name', text: 'Alex Rivera' }),
        h('span', { class: 'account__email', text: 'alex@example.com' })
      ),
      icon('chevron-down', 'account__chevron')
    );

    ui.topbar = h('header', { class: 'topbar' }, ui.search, ui.notifications, ui.account);
    return ui.topbar;
  }

  /* ------------------------------------------------------------------
     New Releases
     ------------------------------------------------------------------ */
  function buildNewReleases() {
    ui.heroTags = h('div', { class: 'tag-list', id: 'hero-tags' });
    ui.heroTitle = h('h3', { class: 'feature-card__title', id: 'hero-title' });
    ui.heroDesc = h('p', { class: 'feature-card__desc', id: 'hero-desc' });

    ui.heroPlay = h(
      'button',
      { class: 'btn btn--primary', type: 'button' },
      icon('play-wide', 'icon--filled btn__icon'),
      'Play'
    );
    ui.heroDownload = h(
      'button',
      { class: 'btn btn--secondary', type: 'button' },
      icon('download', 'btn__icon'),
      'Download'
    );
    ui.heroMore = h(
      'button',
      { class: 'btn btn--icon', type: 'button', 'aria-label': 'More options' },
      icon('more', 'icon--filled btn__icon')
    );

    ui.heroPrev = buildArrowButton('left', 'Previous release', () => {
      state.heroIndex = wrap(state.heroIndex - 1, newReleases.length);
      renderHero();
    });
    ui.heroNext = buildArrowButton('right', 'Next release', () => {
      state.heroIndex = wrap(state.heroIndex + 1, newReleases.length);
      renderHero();
    });

    ui.heroCard = h(
      'div',
      { class: 'feature-card', id: 'hero-card' },
      h('div', { class: 'feature-card__scrim' }),
      h(
        'div',
        { class: 'feature-card__content' },
        ui.heroTags,
        ui.heroTitle,
        ui.heroDesc,
        h(
          'div',
          { class: 'feature-card__actions' },
          h('div', { class: 'feature-card__buttons' }, ui.heroPlay, ui.heroDownload, ui.heroMore),
          h('div', { class: 'carousel-controls' }, ui.heroPrev, ui.heroNext)
        )
      )
    );

    ui.heroDots = buildCarouselDots({
      id: 'hero-dots',
      label: 'New releases pages',
      itemLabel: 'Go to release',
      count: newReleases.length,
      onPick: (index) => {
        state.heroIndex = index;
        renderHero();
      },
    });

    ui.newReleases = h(
      'section',
      { class: 'feature feature--primary', 'aria-labelledby': 'new-releases-title' },
      h('h2', { class: 'feature__title', id: 'new-releases-title', text: 'New Releases' }),
      ui.heroCard,
      ui.heroDots
    );
    return ui.newReleases;
  }

  /* ------------------------------------------------------------------
     Top Rated
     ------------------------------------------------------------------ */
  function buildTopRated() {
    ui.topGenre = h('span', { class: 'tag', id: 'top-genre' });
    ui.topScore = h('span', { id: 'top-score' });
    ui.topTitle = h('h3', { class: 'feature-card__title', id: 'top-title' });
    ui.topDesc = h('p', { class: 'feature-card__desc', id: 'top-desc' });

    ui.topPlay = h(
      'button',
      { class: 'play-button play-button--accent', id: 'top-play', type: 'button' },
      icon('play', 'icon--filled play-button__icon')
    );

    ui.topPrev = buildArrowButton('left', 'Previous top rated', () => {
      state.topIndex = wrap(state.topIndex - 1, topRated.length);
      renderTop();
    });
    ui.topNext = buildArrowButton('right', 'Next top rated', () => {
      state.topIndex = wrap(state.topIndex + 1, topRated.length);
      renderTop();
    });

    ui.topCard = h(
      'div',
      { class: 'feature-card feature-card--compact', id: 'top-card' },
      h('div', { class: 'feature-card__scrim' }),
      h(
        'div',
        { class: 'feature-card__content' },
        h(
          'div',
          { class: 'tag-list' },
          ui.topGenre,
          h('span', { class: 'tag tag--rating' }, icon('star', 'tag__star'), ui.topScore)
        ),
        ui.topTitle,
        ui.topDesc,
        h(
          'div',
          { class: 'feature-card__actions' },
          ui.topPlay,
          h('div', { class: 'carousel-controls' }, ui.topPrev, ui.topNext)
        )
      )
    );

    ui.topDots = buildCarouselDots({
      id: 'top-dots',
      label: 'Top rated pages',
      itemLabel: 'Go to top rated',
      count: topRated.length,
      onPick: (index) => {
        state.topIndex = index;
        renderTop();
      },
    });

    ui.topRated = h(
      'section',
      { class: 'feature feature--secondary', 'aria-labelledby': 'top-rated-title' },
      h('h2', { class: 'feature__title', id: 'top-rated-title', text: 'Top Rated' }),
      ui.topCard,
      ui.topDots
    );
    return ui.topRated;
  }

  /* ------------------------------------------------------------------
     Recommended
     ------------------------------------------------------------------ */
  function buildChip(genre) {
    return h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': 'false',
      'data-genre': genre,
      text: genre,
      onClick: () => {
        state.genre = genre;
        renderChips();
        renderMovies();
      },
    });
  }

  function buildMovieCard(movie) {
    const isSaved = state.bookmarked.has(movie.title);

    const bookmark = h(
      'button',
      {
        class: 'movie-card__bookmark',
        type: 'button',
        'aria-label': `Bookmark ${movie.title}`,
        'aria-pressed': String(isSaved),
      },
      icon('bookmark', 'movie-card__bookmark-icon')
    );
    bookmark.addEventListener('click', () => {
      const nowSaved = !state.bookmarked.has(movie.title);
      if (nowSaved) {
        state.bookmarked.add(movie.title);
      } else {
        state.bookmarked.delete(movie.title);
      }
      bookmark.setAttribute('aria-pressed', String(nowSaved));
    });

    const card = h(
      'article',
      { class: 'movie-card' },
      h('div', { class: 'movie-card__scrim' }),
      bookmark,
      h(
        'div',
        { class: 'movie-card__content' },
        h(
          'div',
          { class: 'movie-card__info' },
          h('span', { class: 'tag tag--small', text: movie.genre }),
          h('h3', { class: 'movie-card__title', text: movie.title }),
          h('p', { class: 'movie-card__desc', text: movie.desc })
        ),
        h(
          'button',
          {
            class: 'play-button play-button--glass',
            type: 'button',
            'aria-label': `Play ${movie.title}`,
          },
          icon('play', 'icon--filled play-button__icon')
        )
      )
    );
    card.style.setProperty('--art', movie.art);
    return card;
  }

  function buildRecommended() {
    ui.chips = h('div', { class: 'chips', id: 'genre-chips', role: 'group', 'aria-label': 'Filter by genre' });
    ui.chips.append(...genres.map(buildChip));

    ui.seeAll = h('button', {
      class: 'btn btn--soft',
      id: 'see-all',
      type: 'button',
      'aria-pressed': 'false',
      text: 'See all',
      onClick: () => {
        state.showAll = !state.showAll;
        renderMovies();
      },
    });

    ui.movieGrid = h('div', { class: 'movie-grid', id: 'movie-grid' });
    ui.emptyState = h('p', {
      class: 'empty-state',
      id: 'empty-state',
      hidden: true,
      text: 'Nothing matches that search. Try another title or switch the genre back to All.',
    });

    ui.recommended = h(
      'section',
      { class: 'recommended', 'aria-labelledby': 'recommended-title' },
      h(
        'div',
        { class: 'recommended__header' },
        h('h2', { class: 'recommended__title', id: 'recommended-title', text: 'Recommended for you' }),
        ui.chips,
        ui.seeAll
      ),
      ui.movieGrid,
      ui.emptyState
    );
    return ui.recommended;
  }

  /* ------------------------------------------------------------------
     App shell
     ------------------------------------------------------------------ */
  function buildApp() {
    ui.heroRow = h('div', { class: 'hero-row' }, buildNewReleases(), buildTopRated());
    ui.main = h('main', { class: 'main' }, buildTopbar(), ui.heroRow, buildRecommended());
    ui.app = h('div', { class: 'app' }, buildSidebar(), ui.main);
    return ui.app;
  }

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */
  function renderHero() {
    const item = newReleases[state.heroIndex];
    ui.heroCard.style.setProperty('--art', item.art);
    ui.heroTitle.textContent = item.title;
    ui.heroDesc.textContent = item.desc;
    ui.heroTags.replaceChildren(
      ...item.tags.map((label) => h('span', { class: 'tag', text: label }))
    );
    setActiveDot(ui.heroDots, state.heroIndex);
  }

  function renderTop() {
    const item = topRated[state.topIndex];
    ui.topCard.style.setProperty('--art', item.art);
    ui.topGenre.textContent = item.genre;
    ui.topScore.textContent = item.score;
    ui.topTitle.textContent = item.title;
    ui.topDesc.textContent = item.desc;
    ui.topPlay.setAttribute('aria-label', `Play ${item.title}`);
    setActiveDot(ui.topDots, state.topIndex);
  }

  function getMatches() {
    const query = state.query.trim().toLowerCase();
    return movies.filter((movie) => {
      const genreMatches = state.genre === 'All' || movie.genre === state.genre;
      const textMatches =
        query === '' ||
        movie.title.toLowerCase().includes(query) ||
        movie.genre.toLowerCase().includes(query);
      return genreMatches && textMatches;
    });
  }

  function renderMovies() {
    const matches = getMatches();
    const visible = state.showAll ? matches : matches.slice(0, PREVIEW_COUNT);

    ui.movieGrid.replaceChildren(...visible.map(buildMovieCard));
    ui.movieGrid.hidden = matches.length === 0;
    ui.emptyState.hidden = matches.length > 0;

    ui.seeAll.textContent = state.showAll ? 'Show less' : 'See all';
    ui.seeAll.setAttribute('aria-pressed', String(state.showAll));
  }

  function renderChips() {
    [...ui.chips.children].forEach((chip) => {
      const isActive = chip.dataset.genre === state.genre;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
  }

  function renderAll() {
    renderHero();
    renderTop();
    renderChips();
    renderMovies();
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function mount(parent = document.body) {
    parent.append(ui.app);
  }

  buildApp();
  renderAll();
  mount();

  window.Lumen = {
    ui,
    state,
    data: { newReleases, topRated, movies, genres },
    build: {
      app: buildApp,
      sidebar: buildSidebar,
      topbar: buildTopbar,
      newReleases: buildNewReleases,
      topRated: buildTopRated,
      recommended: buildRecommended,
      movieCard: buildMovieCard,
      navItem: buildNavItem,
      chip: buildChip,
    },
    render: {
      all: renderAll,
      hero: renderHero,
      top: renderTop,
      chips: renderChips,
      movies: renderMovies,
    },
    mount,
    h,
    svg,
    icon,
  };
})();
