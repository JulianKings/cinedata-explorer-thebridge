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