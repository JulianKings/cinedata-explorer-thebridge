import { getSavedMovies } from './savedMovies.js';

const MAX_GENRE_SLICES = 5;
const SCORE_BUCKETS = [
    { label: '< 5', min: 0, max: 5 },
    { label: '5–6', min: 5, max: 6 },
    { label: '6–7', min: 6, max: 7 },
    { label: '7–8', min: 7, max: 8 },
    { label: '8+',  min: 8, max: Infinity },
];

const countBy = (keys) => keys.reduce((map, key) => map.set(key, (map.get(key) ?? 0) + 1), new Map());

function getGenreRows(movies, genres) {
    const all = [...countBy(movies.flatMap((movie) => movie.genre_ids ?? []))]
        .map(([id, count]) => ({ label: genres.find((genre) => genre.id === id)?.name ?? 'Desconocido', count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    const top = all.slice(0, MAX_GENRE_SLICES);
    const rest = all.slice(MAX_GENRE_SLICES).reduce((sum, row) => sum + row.count, 0);
    if (rest) top.push({ label: 'Otros', count: rest });
    return { chart: top, all };
}

function getDecadeRows(movies) {
    const decades = countBy(movies
        .map((movie) => Number(movie.release_date?.slice(0, 4)))
        .filter(Boolean)
        .map((year) => Math.floor(year / 10) * 10));
    if (decades.size === 0) return [];

    // fill the gaps so the timeline stays honest
    const keys = [...decades.keys()];
    const rows = [];
    for (let decade = Math.min(...keys); decade <= Math.max(...keys); decade += 10) {
        rows.push({ label: `${decade}s`, count: decades.get(decade) ?? 0 });
    }
    return rows;
}

function getScoreRows(rated) {
    return SCORE_BUCKETS.map(({ label, min, max }) => ({
        label,
        count: rated.filter((movie) => movie.vote_average >= min && movie.vote_average < max).length,
    }));
}

function getSavedStats(genres) {
    const movies = getSavedMovies();
    const rated = movies.filter((movie) => movie.vote_average > 0); // 0 = no votes yet, not a bad score

    const genreRows = getGenreRows(movies, genres);
    const decadeRows = getDecadeRows(movies);
    const topDecade = [...decadeRows].sort((a, b) => b.count - a.count)[0];

    return {
        total: movies.length,
        averageScore: rated.length ? rated.reduce((sum, movie) => sum + movie.vote_average, 0) / rated.length : null,
        topGenre: genreRows.all[0]?.label ?? null,
        topDecade: topDecade?.count ? topDecade.label : null,
        genreRows: genreRows.chart,
        genreTableRows: genreRows.all,
        decadeRows,
        scoreRows: getScoreRows(rated),
    };
}

export { getSavedStats };