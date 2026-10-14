import Movie from './movie.js';

export default class MovieDetails extends Movie {
    constructor(data) {
        super(data);
        this.tagline = data.tagline ?? '';
        this.runtime = data.runtime ?? null;
        this.genreList = data.genre_list ?? [];
        this.directors = data.directors ?? [];
        this.cast = data.cast ?? [];
        this.trailerKey = data.trailer_key ?? null;
        this.recommendations = data.recommendations ?? [];
        this.belongToCollection = data.belongs_to_collection ?? [];
        this.productionCountries = data.production_countries ?? [];
    }

    get formattedRuntime() {
        if (!this.runtime) return null;
        const minutes = this.runtime;
        const hours = Math.floor(minutes / 60);
        return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
    }

    static fromResponse(response) {
        const genres = response.genres ?? [];
        const crew = response.credits?.crew ?? [];
        const cast = response.credits?.cast ?? [];
        const videos = (response.videos?.results ?? []).filter((video) => video.site === 'YouTube');
        const trailer = videos.find((video) => video.type === 'Trailer') ?? videos[0];

        return new MovieDetails({
            id: response.id,
            title: response.title,
            release_date: response.release_date,
            score: response.vote_average,
            overview: response.overview,
            poster_path: response.poster_path,
            backdrop_path: response.backdrop_path,
            genres: genres.map((genre) => genre.id),
            genre_list: genres.map((genre) => ({ id: genre.id, name: genre.name })),
            tagline: response.tagline,
            runtime: response.runtime,
            directors: crew.filter((person) => person.job === 'Director').map((person) => person.name),
            cast: cast.slice(0, 12).map((person) => ({
                name: person.name,
                character: person.character,
                profilePath: person.profile_path,
            })),
            trailer_key: trailer?.key ?? null,
            recommendations: (response.recommendations?.results ?? []).map((movie) => Movie.fromResponse(movie)),
            belongs_to_collection: response.belongs_to_collection,
            production_countries: (response.production_countries ?? [])
                .map(({ iso_3166_1, name }) => ({ code: iso_3166_1, name }))
        });
    }
}
