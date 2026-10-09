
(() => {
  'use strict';

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
     Elements
     ------------------------------------------------------------------ */
  const $ = (selector) => document.querySelector(selector);

  const el = {
    heroCard: $('#hero-card'),
    heroTags: $('#hero-tags'),
    heroTitle: $('#hero-title'),
    heroDesc: $('#hero-desc'),
    heroDots: $('#hero-dots'),
    topCard: $('#top-card'),
    topGenre: $('#top-genre'),
    topScore: $('#top-score'),
    topTitle: $('#top-title'),
    topDesc: $('#top-desc'),
    topPlay: $('#top-play'),
    topDots: $('#top-dots'),
    chips: $('#genre-chips'),
    search: $('#search-input'),
    seeAll: $('#see-all'),
    grid: $('#movie-grid'),
    empty: $('#empty-state'),
    template: $('#movie-card-template'),
  };

  const wrap = (index, length) => (index + length) % length;

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */
  function setActiveDot(container, activeIndex) {
    container.querySelectorAll('.carousel-dot').forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function renderHero() {
    const item = newReleases[state.heroIndex];
    el.heroCard.style.setProperty('--art', item.art);
    el.heroTitle.textContent = item.title;
    el.heroDesc.textContent = item.desc;
    el.heroTags.replaceChildren(
      ...item.tags.map((label) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = label;
        return tag;
      })
    );
    setActiveDot(el.heroDots, state.heroIndex);
  }

  function renderTop() {
    const item = topRated[state.topIndex];
    el.topCard.style.setProperty('--art', item.art);
    el.topGenre.textContent = item.genre;
    el.topScore.textContent = item.score;
    el.topTitle.textContent = item.title;
    el.topDesc.textContent = item.desc;
    el.topPlay.setAttribute('aria-label', `Play ${item.title}`);
    setActiveDot(el.topDots, state.topIndex);
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

  function createMovieCard(movie) {
    const card = el.template.content.firstElementChild.cloneNode(true);
    card.style.setProperty('--art', movie.art);
    card.querySelector('.tag').textContent = movie.genre;
    card.querySelector('.movie-card__title').textContent = movie.title;
    card.querySelector('.movie-card__desc').textContent = movie.desc;
    card.querySelector('.play-button').setAttribute('aria-label', `Play ${movie.title}`);

    const bookmark = card.querySelector('.movie-card__bookmark');
    bookmark.setAttribute('aria-label', `Bookmark ${movie.title}`);
    bookmark.setAttribute('aria-pressed', String(state.bookmarked.has(movie.title)));
    bookmark.addEventListener('click', () => {
      const isSaved = !state.bookmarked.has(movie.title);
      if (isSaved) {
        state.bookmarked.add(movie.title);
      } else {
        state.bookmarked.delete(movie.title);
      }
      bookmark.setAttribute('aria-pressed', String(isSaved));
    });

    return card;
  }

  function renderMovies() {
    const matches = getMatches();
    const visible = state.showAll ? matches : matches.slice(0, PREVIEW_COUNT);

    el.grid.replaceChildren(...visible.map(createMovieCard));
    el.grid.hidden = matches.length === 0;
    el.empty.hidden = matches.length > 0;

    el.seeAll.textContent = state.showAll ? 'Show less' : 'See all';
    el.seeAll.setAttribute('aria-pressed', String(state.showAll));
  }

  function renderChips() {
    el.chips.querySelectorAll('.chip').forEach((chip) => {
      const isActive = chip.dataset.genre === state.genre;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
  }

  /* ------------------------------------------------------------------
     Events
     ------------------------------------------------------------------ */
  document.querySelector('[data-hero="prev"]').addEventListener('click', () => {
    state.heroIndex = wrap(state.heroIndex - 1, newReleases.length);
    renderHero();
  });

  document.querySelector('[data-hero="next"]').addEventListener('click', () => {
    state.heroIndex = wrap(state.heroIndex + 1, newReleases.length);
    renderHero();
  });

  document.querySelector('[data-top="prev"]').addEventListener('click', () => {
    state.topIndex = wrap(state.topIndex - 1, topRated.length);
    renderTop();
  });

  document.querySelector('[data-top="next"]').addEventListener('click', () => {
    state.topIndex = wrap(state.topIndex + 1, topRated.length);
    renderTop();
  });

  el.heroDots.addEventListener('click', (event) => {
    const dot = event.target.closest('.carousel-dot');
    if (!dot) return;
    state.heroIndex = [...el.heroDots.children].indexOf(dot);
    renderHero();
  });

  el.topDots.addEventListener('click', (event) => {
    const dot = event.target.closest('.carousel-dot');
    if (!dot) return;
    state.topIndex = [...el.topDots.children].indexOf(dot);
    renderTop();
  });

  el.chips.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    state.genre = chip.dataset.genre;
    renderChips();
    renderMovies();
  });

  el.search.addEventListener('input', () => {
    state.query = el.search.value;
    renderMovies();
  });

  el.seeAll.addEventListener('click', () => {
    state.showAll = !state.showAll;
    renderMovies();
  });

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  renderHero();
  renderTop();
  renderChips();
  renderMovies();
})();
