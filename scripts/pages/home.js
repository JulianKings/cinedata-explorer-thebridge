import { getUpcoming, getTopRated } from "../data/apiLoader.js";
import Media from "../data/models/media.js";
import { h, icon, svg } from '../layoutUtils.js';

const COPY = {
    movie: { upcoming: 'Estrenos más esperados', topRated: 'Mejor valoradas', item: 'película' },
    tv:    { upcoming: 'Próximos estrenos',      topRated: 'Series mejor valoradas', item: 'serie' },
};

async function printHome(main, buildMoviesList, genres, heroCards, setHeroArt, setupSlider, mediaType = 'movie') {
    const copy = COPY[mediaType];

    const heroCollapse = document.createElement('div');
    heroCollapse.classList.add('hero-collapse');
    main.appendChild(heroCollapse);

    const heroRow = document.createElement('div');
    heroRow.classList.add('hero-row');
    heroCollapse.appendChild(heroRow);

    const upcomingMovies = (await getUpcoming(mediaType)).results
        .filter((item) => item.backdrop_path || item.poster_path) // brand-new shows often have no art yet
        .map((item) => Media.fromResponse(item, mediaType));

    const upcomingMovieBox = document.createElement('section');
    upcomingMovieBox.classList.add('feature', 'feature--primary');
    upcomingMovieBox.setAttribute('aria-labelledby', 'new-releases-title');
    heroRow.appendChild(upcomingMovieBox);

    const upcomingMovieBoxTitle = document.createElement('h2');
    upcomingMovieBoxTitle.classList.add('feature__title');
    upcomingMovieBoxTitle.setAttribute('id', 'new-releases-title');
    upcomingMovieBoxTitle.textContent = copy.upcoming;
    upcomingMovieBox.appendChild(upcomingMovieBoxTitle);

    const upcomingSlider = document.createElement('div');
    upcomingSlider.classList.add('feature-slider', 'feature-slider--primary');
    upcomingSlider.setAttribute('role', 'group');
    upcomingSlider.setAttribute('aria-roledescription', 'carrusel');
    upcomingSlider.setAttribute('aria-label', copy.upcoming);
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
    const topRatedMovies = (await getTopRated(mediaType)).results.map((movie) => Media.fromResponse(movie, mediaType));
    const topRated = document.createElement('section');
    topRated.classList.add('feature', 'feature--secondary');
    topRated.setAttribute('aria-labelledby', 'top-rated-title');
    heroRow.appendChild(topRated);

    const topRatedTitle = document.createElement('h2');
    topRatedTitle.classList.add('feature__title');
    topRatedTitle.setAttribute('id', 'top-rated-title');
    topRatedTitle.textContent = copy.topRated;
    topRated.appendChild(topRatedTitle);

    const topRatedSlider = document.createElement('div');
    topRatedSlider.classList.add('feature-slider', 'feature-slider--compact');
    topRatedSlider.setAttribute('role', 'group');
    topRatedSlider.setAttribute('aria-roledescription', 'carrusel');
    topRatedSlider.setAttribute('aria-label', copy.topRated);
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
    topRatedPrev.setAttribute('aria-label', `${copy.item[0].toUpperCase()}${copy.item.slice(1)} anterior`);
    topRatedControls.appendChild(topRatedPrev);
    topRatedPrev.appendChild(icon('arrow-left', 'carousel-arrow__icon'));

    const topRatedNext = document.createElement('button');
    topRatedNext.classList.add('carousel-arrow');
    topRatedNext.setAttribute('type', 'button');
    topRatedNext.setAttribute('aria-label', `Siguiente ${copy.item}`);
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
        dotLabel: `Ir a la ${copy.item}`,
    });

    // Recommended
    buildMoviesList(main);
}

export { printHome }