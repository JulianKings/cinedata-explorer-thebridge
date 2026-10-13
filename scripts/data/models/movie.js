import { createGenreTag } from "../../utils.js";

export default class Movie {
    constructor({ id, title, release_date, score, overview = "", poster_path = "", backdrop_path = "", genres = [] }) {
        this.id = id;
        this.title = title;
        this.releaseDate = release_date;
        this.score = score;
        this.overview = overview;
        this.posterPath = poster_path;
        this.backdropPath = backdrop_path;
        this.genres = genres;
    }

    buildUpcomingCard(heroCards, upcomingTrack, genresList, setHeroArt, icon) {
        const upcomingMovieCard = document.createElement('div');
        upcomingMovieCard.classList.add('feature-card');

        const upcomingMovieCardContent = document.createElement('div');
        upcomingMovieCardContent.classList.add('feature-card__content');
        upcomingMovieCard.appendChild(upcomingMovieCardContent);

        const upcomingMovieTag = document.createElement('div');
        upcomingMovieTag.classList.add('tag-list');
        upcomingMovieCardContent.appendChild(upcomingMovieTag);

        this.genres.forEach((genreId) => {
            const genre = genresList.find((genre) => genre.id === genreId);
            if (genre) upcomingMovieTag.appendChild(createGenreTag(genre));
        });

        const upcomingMovieTitle = document.createElement('h3');
        upcomingMovieTitle.classList.add('feature-card__title');
        upcomingMovieTitle.textContent = this.title;
        upcomingMovieCardContent.appendChild(upcomingMovieTitle);

        const upcomingMovieDesc = document.createElement('p');
        upcomingMovieDesc.classList.add('feature-card__desc');
        upcomingMovieDesc.textContent = this.overview;
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
        upcomingMovieButtonsReleaseText.textContent = this.releaseDate ?? 'Próximamente';
        upcomingMovieButtonsRelease.appendChild(upcomingMovieButtonsReleaseText);

        const upcomingMovieButtonsDetails = document.createElement('button');
        upcomingMovieButtonsDetails.classList.add('btn', 'btn--icon');
        upcomingMovieButtonsDetails.setAttribute('type', 'button');
        upcomingMovieButtonsDetails.setAttribute('aria-label', 'Más información');
        upcomingMovieButtonsDetails.dataset.details = this.id;

        const upcomingMovieButtonsDetailsIcon = icon('more', 'icon--filled btn__icon');
        upcomingMovieButtonsDetails.appendChild(upcomingMovieButtonsDetailsIcon);
        upcomingMovieButtons.appendChild(upcomingMovieButtonsDetails);

        heroCards.push({ card: upcomingMovieCard, movie: this });
        setHeroArt(upcomingMovieCard, this);
        upcomingTrack.appendChild(upcomingMovieCard);
    }

    buildRatedCard(heroCards, topRatedTrack, genresList, setHeroArt, icon) {
        const topRatedCard = document.createElement('div');
        topRatedCard.classList.add('feature-card', 'feature-card--compact');
        topRatedCard.dataset.id = this.id;

        const topRatedCardContent = document.createElement('div');
        topRatedCardContent.classList.add('feature-card__content');
        topRatedCard.appendChild(topRatedCardContent);

        const topRatedCardTags = document.createElement('div');
        topRatedCardTags.classList.add('tag-list');
        topRatedCardContent.appendChild(topRatedCardTags);

        for (const tag of this.genres) {
            const genre = genresList.find((genre) => genre.id === tag);
            if (genre) topRatedCardTags.appendChild(createGenreTag(genre));
        }

        const tagScore = document.createElement('span');
        tagScore.classList.add('tag', 'tag--rating');
        topRatedCardTags.appendChild(tagScore);

        const tagScoreIcon = icon('star', 'tag__star');
        tagScore.appendChild(tagScoreIcon);

        const tagScoreText = document.createElement('span');
        tagScoreText.textContent = this.score.toFixed(1);
        tagScore.appendChild(tagScoreText);

        const topRatedCardTitle = document.createElement('h3');
        topRatedCardTitle.classList.add('feature-card__title');
        topRatedCardTitle.textContent = this.title;
        topRatedCardContent.appendChild(topRatedCardTitle);

        const topRatedCardDesc = document.createElement('p');
        topRatedCardDesc.classList.add('feature-card__desc');
        topRatedCardDesc.textContent = this.overview;
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
        topRatedCardButtonsDetails.dataset.details = this.id;
        topRatedCardButtons.appendChild(topRatedCardButtonsDetails);

        const topRatedCardButtonsDetailsIcon = icon('more', 'icon--filled btn__icon');
        topRatedCardButtonsDetails.appendChild(topRatedCardButtonsDetailsIcon);
        topRatedCardButtons.appendChild(topRatedCardButtonsDetails);

        heroCards.push({ card: topRatedCard, movie: this });
        setHeroArt(topRatedCard, this);
        topRatedTrack.appendChild(topRatedCard);
    }

    buildGeneralCard(movieGrid, index, genresList, heroCards, setHeroArt, icon) {
        const movieCard = document.createElement('article');
        movieCard.classList.add('movie-card');
        movieCard.style.setProperty('--i', index);
        movieCard.dataset.id = this.id;

        const movieCardScrim = document.createElement('div');
        movieCardScrim.classList.add('movie-card__scrim');
        movieCard.appendChild(movieCardScrim);

        const movieCardBookmark = document.createElement('button');
        movieCardBookmark.classList.add('movie-card__bookmark');
        movieCardBookmark.setAttribute('type', 'button');
        movieCardBookmark.setAttribute('aria-label', 'Marcar como visto');
        movieCardBookmark.addEventListener('click', () => console.log('marcar como visto'));
        movieCard.appendChild(movieCardBookmark);

        const movieCardBookmarkIcon = icon('bookmark', 'movie-card__bookmark-icon');
        movieCardBookmark.appendChild(movieCardBookmarkIcon);

        const movieCardContent = document.createElement('div');
        movieCardContent.classList.add('movie-card__content');
        movieCard.appendChild(movieCardContent);

        const movieCardInfo = document.createElement('div');
        movieCardInfo.classList.add('movie-card__info');
        movieCardContent.appendChild(movieCardInfo);

        this.genres.slice(0, 2)
            .map((genreId) => genresList.find((genre) => genre.id === genreId))
            .filter(Boolean)
            .forEach((genre) => movieCardInfo.appendChild(createGenreTag(genre, true)));

        const movieCardTitle = document.createElement('h3');
        movieCardTitle.classList.add('movie-card__title');
        movieCardTitle.textContent = this.title;
        movieCardInfo.appendChild(movieCardTitle);

        const movieCardDesc = document.createElement('p');
        movieCardDesc.classList.add('movie-card__desc');
        movieCardDesc.textContent = this.overview;
        movieCardInfo.appendChild(movieCardDesc);

        const movieCardButton = document.createElement('button');
        movieCardButton.classList.add('play-button', 'play-button--glass');
        movieCardButton.setAttribute('type', 'button');
        movieCardButton.setAttribute('aria-label', 'Mas información');
        movieCardButton.dataset.details = this.id;
        movieCardContent.appendChild(movieCardButton);

        const movieCardButtonIcon = icon('more', 'icon--filled btn__icon');
        movieCardButton.appendChild(movieCardButtonIcon);

        heroCards.push({ card: movieCard, movie: this });
        setHeroArt(movieCard, this);
        movieGrid.appendChild(movieCard);
    }

    static fromResponse(response) {
        return new Movie({
            id: response.id,
            title: response.title,
            release_date: response.release_date,
            score: response.vote_average,
            overview: response.overview,
            poster_path: response.poster_path,
            backdrop_path: response.backdrop_path,
            genres: response.genre_ids,
        });
    }
}