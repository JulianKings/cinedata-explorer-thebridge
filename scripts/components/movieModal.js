import { getMovieDetails } from '../data/apiLoader.js';
import MovieDetails from '../data/models/movieDetails.js';
import { imageUrl } from '../utils.js';
import { h, icon } from '../layoutUtils.js';

let dialog = null;
let body = null;
let requestId = 0;
let originCard = null;

const MORPH_NAME = 'movie-morph';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// UTIL
function canMorph(card) {
    if (!document.startViewTransition || reducedMotion.matches) return false;
    if (!card?.isConnected || card.closest('[inert]')) return false; // gone, or a hidden carousel slide
    const rect = card.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
}

// Card <-> modal: the browser snapshots `from`, runs `update`, then animates that snapshot into `to`
function morph(from, to, update) {
    const root = document.documentElement;
    from.style.viewTransitionName = MORPH_NAME;
    root.classList.add('is-morphing');

    const transition = document.startViewTransition(() => {
        from.style.viewTransitionName = ''; // a name can only be on one element at a time
        update();
        to.style.viewTransitionName = MORPH_NAME;
    });
    transition.finished.finally(() => {
        to.style.viewTransitionName = '';
        root.classList.remove('is-morphing');
    });
    return transition;
}

function buildLoading(card) {
    const loading = h('div', { class: 'movie-modal__loading', 'aria-busy': 'true', 'aria-label': 'Cargando' });
    // reuse the card's image so the morph lands on the same picture
    const art = card?.style.getPropertyValue('--art');
    if (art) {
        loading.classList.add('movie-modal__loading--art');
        loading.style.setProperty('--art', art);
    }
    return loading;
}

// DOM
function getDialog() {
    if (dialog) return dialog;

    body = h('div', { class: 'movie-modal__body' });
    dialog = h('dialog', { class: 'movie-modal', 'aria-labelledby': 'details-title' },
        h('button', {
            class: 'btn btn--icon movie-modal__close',
            type: 'button',
            'aria-label': 'Cerrar',
            onClick: closeMovieModal,
        }, icon('close', 'btn__icon')),
        body
    );

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeMovieModal();
    });

    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeMovieModal();
    });

    document.body.appendChild(dialog);
    return dialog;
}

function closeMovieModal() {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    if (document.documentElement.classList.contains('is-morphing')) return;
    requestId++;

    const finish = () => {
        dialog.classList.remove('is-closing', 'is-morphed');
        dialog.close();
        body.replaceChildren();
    };

    if (canMorph(originCard)) {
        morph(dialog, originCard, finish);
        return;
    }

    const onEnd = (event) => {
        if (event.target !== dialog || event.pseudoElement) return;
        dialog.removeEventListener('animationend', onEnd);
        finish();
    };
    dialog.addEventListener('animationend', onEnd);
    dialog.classList.add('is-closing');
}

function buildHero(movie) {
    const backdrop = imageUrl(movie.backdropPath, 'w1280');
    const poster = imageUrl(movie.posterPath, 'w500');
    const meta = [
        movie.releaseDate?.slice(0, 4),
        movie.formattedRuntime,
        movie.directors.length && `Dirigida por ${movie.directors.join(', ')}`,
    ].filter(Boolean).join(' · ');

    const hero = h('section', { class: 'details-hero' },
        h('div', { class: 'details-hero__content' },
            poster && h('img', { class: 'details-hero__poster', src: poster, alt: `Póster de ${movie.title}`, width: 500, height: 750 }),
            h('div', { class: 'details-hero__info' },
                h('div', { class: 'tag-list' },
                    movie.genreNames.map((name) => h('span', { class: 'tag', text: name })),
                    h('span', { class: 'tag tag--rating' },
                        icon('star', 'tag__star'),
                        h('span', { text: movie.score.toFixed(1) })
                    )
                ),
                h('h2', { class: 'details-hero__title', id: 'details-title', text: movie.title }),
                movie.tagline && h('p', { class: 'details-hero__tagline', text: movie.tagline }),
                meta && h('p', { class: 'details-hero__meta', text: meta }),
                h('p', { class: 'details-hero__overview', text: movie.overview || 'Sin sinopsis disponible.' }),
                movie.trailerKey && h('div', { class: 'feature-card__buttons' },
                    h('a', {
                        class: 'btn btn--primary',
                        href: `https://www.youtube.com/watch?v=${movie.trailerKey}`,
                        target: '_blank',
                        rel: 'noopener',
                    }, icon('play-wide', 'icon--filled btn__icon'), h('span', { text: 'Ver tráiler' }))
                )
            )
        )
    );
    if (backdrop) hero.style.setProperty('--art', `url("${backdrop}") center / cover no-repeat`);
    return hero;
}

function buildCast(movie) {
    if (movie.cast.length === 0) return null;
    return h('section', { class: 'details-section', 'aria-labelledby': 'cast-title' },
        h('h3', { class: 'details-section__title', id: 'cast-title', text: 'Reparto principal' }),
        h('ul', { class: 'cast-list' },
            movie.cast.map((person) => {
                const photo = imageUrl(person.profilePath, 'w185');
                return h('li', { class: 'cast-card' },
                    photo
                        ? h('img', { class: 'cast-card__photo', src: photo, alt: '', loading: 'lazy', width: 185, height: 278 })
                        : h('div', { class: 'cast-card__photo cast-card__photo--empty' }, icon('user')),
                    h('p', { class: 'cast-card__name', text: person.name }),
                    person.character && h('p', { class: 'cast-card__role', text: person.character })
                );
            })
        )
    );
}

function buildRecommendations(movie, genres, setHeroArt) {
    if (movie.recommendations.length === 0) return null;
    const grid = h('div', { class: 'movie-grid' });
    const cards = [];
    movie.recommendations.slice(0, 6).forEach((recommended, index) => {
        recommended.buildGeneralCard(grid, index, genres, cards, setHeroArt, icon);
    });
    return h('section', { class: 'details-section', 'aria-labelledby': 'similar-title' },
        h('h3', { class: 'details-section__title', id: 'similar-title', text: 'Te puede gustar' }),
        grid
    );
}

async function openMovieModal(movieId, genres, setHeroArt, sourceCard = null) {
    const modal = getDialog();
    const id = ++requestId;
    const request = getMovieDetails(movieId);

    const showLoading = () => {
        modal.classList.remove('is-closing');
        body.replaceChildren(buildLoading(sourceCard));
        body.scrollTop = 0;
        if (!modal.open) modal.showModal();
    };

    if (!modal.open) originCard = sourceCard;
    if (!modal.open && canMorph(sourceCard)) {
        await morph(sourceCard, modal, () => {
            modal.classList.add('is-morphed');
            showLoading();
        }).updateCallbackDone;
    } else {
        showLoading();
    }

    let movie;
    try {
        movie = MovieDetails.fromResponse(await getMovieDetails(movieId));
    } catch (error) {
        console.error(error);
        if (id !== requestId) return;
        body.replaceChildren(h('p', { class: 'empty-state', text: 'No se pudo cargar la película.' }));
        return;
    }
    if (id !== requestId) return;

    body.replaceChildren(...[
        buildHero(movie),
        buildCast(movie),
        buildRecommendations(movie, genres, setHeroArt),
    ].filter(Boolean));
}

export { openMovieModal, closeMovieModal };