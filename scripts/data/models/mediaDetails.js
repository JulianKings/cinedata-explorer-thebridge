import Media from './media.js';

export default class MediaDetails extends Media {
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
        this.seasons = data.number_of_seasons ?? null;
    }

    get formattedRuntime() {
        if (!this.runtime) return null;
        const minutes = this.runtime;
        const hours = Math.floor(minutes / 60);
        return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
    }

    get formattedSeasons() {
        if (!this.seasons) return null;
        return `${this.seasons} ${this.seasons === 1 ? 'temporada' : 'temporadas'}`;
    }

    static fromResponse(response, mediaType) {
        const genres = response.genres ?? [];
        const crew = response.credits?.crew ?? [];
        const cast = response.credits?.cast ?? [];
        const videos = (response.videos?.results ?? []).filter((video) => video.site === 'YouTube');
        const trailer = videos.find((video) => video.type === 'Trailer') ?? videos[0];
        const isTv = mediaType === 'tv';

        return new MediaDetails({
            id: response.id,
            title: response.title ?? response.name,
            release_date: response.release_date ?? response.first_air_date,
            score: response.vote_average,
            overview: response.overview,
            poster_path: response.poster_path,
            backdrop_path: response.backdrop_path,
            genres: genres.map((genre) => genre.id),
            genre_list: genres.map((genre) => ({ id: genre.id, name: genre.name })),
            tagline: response.tagline,
            runtime: isTv ? (response.episode_run_time?.[0] ?? null) : response.runtime,
            directors: isTv
                ? (response.created_by ?? []).map((person) => person.name)
                : crew.filter((person) => person.job === 'Director').map((person) => person.name),
            number_of_seasons: response.number_of_seasons,
            recommendations: (response.recommendations?.results ?? []).map((item) => Media.fromResponse(item, mediaType)),
            media_type: mediaType,
            cast: cast.slice(0, 12).map((person) => ({
                name: person.name,
                character: person.character,
                profilePath: person.profile_path,
            })),
            trailer_key: trailer?.key ?? null,
            belongs_to_collection: response.belongs_to_collection,
            production_countries: (response.production_countries ?? [])
                .map(({ iso_3166_1, name }) => ({ code: iso_3166_1, name }))
        });
    }
}
