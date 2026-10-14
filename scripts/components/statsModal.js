import { h, icon } from '../layoutUtils.js';
import { getSavedStats } from '../data/savedStats.js';

const CHART_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PIE_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

let chartModule = null;
let dialog = null;
let body = null;
let charts = [];

// UTIL
function loadChartJs() {
    chartModule ??= import(CHART_URL)
        .then(({ Chart, registerables }) => {
            Chart.register(...registerables);
            return Chart;
        })
        .catch((error) => {
            chartModule = null; // allow a retry next time
            throw error;
        });
    return chartModule;
}

function token(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function countUp(node, value, decimals = 0) {
    if (reducedMotion.matches) {
        node.textContent = value.toFixed(decimals);
        return;
    }
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min((now - start) / 900, 1);
        const eased = 1 - (1 - progress) ** 3;
        node.textContent = (value * eased).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// DOM
function getDialog() {
    if (dialog) return dialog;

    body = h('div', { class: 'stats-modal__body' });
    dialog = h('dialog', { class: 'movie-modal stats-modal', 'aria-labelledby': 'stats-title' },
        h('button', {
            class: 'btn btn--icon movie-modal__close',
            type: 'button',
            'aria-label': 'Cerrar',
            onClick: () => closeStatsModal(),
        }, icon('close', 'btn__icon')),
        body
    );

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeStatsModal();
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeStatsModal();
    });

    document.body.appendChild(dialog);
    return dialog;
}

function closeStatsModal() {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;

    const finish = () => {
        charts.forEach((chart) => chart.destroy());
        charts = [];
        dialog.classList.remove('is-closing');
        dialog.close();
        body.replaceChildren();
    };

    if (reducedMotion.matches) return finish();

    const onEnd = (event) => {
        if (event.target !== dialog || event.pseudoElement) return;
        dialog.removeEventListener('animationend', onEnd);
        finish();
    };
    dialog.addEventListener('animationend', onEnd);
    dialog.classList.add('is-closing');
}

function buildTile(label, index) {
    const value = h('p', { class: 'stat-tile__value', text: '—' });
    const tile = h('div', { class: 'stat-tile' },
        h('p', { class: 'stat-tile__label', text: label }),
        value
    );
    tile.style.setProperty('--i', index);
    return { tile, value };
}

function buildTiles(stats) {
    const total = buildTile('Películas guardadas', 0);
    const score = buildTile('Nota media', 1);
    const decade = buildTile('Década favorita', 2);
    const genre = buildTile('Género favorito', 3);

    countUp(total.value, stats.total);
    if (stats.averageScore !== null) countUp(score.value, stats.averageScore, 1);
    decade.value.textContent = stats.topDecade ?? '—';
    genre.value.textContent = stats.topGenre ?? '—';

    return h('div', { class: 'stats-tiles' }, total.tile, score.tile, decade.tile, genre.tile);
}

function renderPieChart(Chart, { canvas, rows }) {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const percent = (count) => Math.round((count / total) * 100);
    const colors = rows.map((row, index) =>
        token(row.label === 'Otros' ? '--color-dot-idle' : PIE_COLORS[index])
    );

    return new Chart(canvas, {
        type: 'pie',
        data: {
            labels: rows.map((row) => row.label),
            datasets: [{
                data: rows.map((row) => row.count),
                backgroundColor: colors,
                borderColor: token('--color-surface'),   // 2px gap in the card's own color
                borderWidth: 2,
                hoverOffset: 10,                         // hovered slice slides out
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },                     // room for the slice to slide out without clipping
            animation: reducedMotion.matches ? false : {
                animateRotate: true,
                animateScale: true,
                duration: 900,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: token('--color-text'),
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 14,
                        // "Drama · 34%" instead of just "Drama"
                        generateLabels: (chart) =>
                            Chart.overrides.pie.plugins.legend.labels.generateLabels(chart)
                                .map((item) => ({ ...item, text: `${item.text} · ${percent(rows[item.index].count)}%` })),
                    },
                },
                tooltip: {
                    ...tooltipStyle(),
                    callbacks: {
                        label: (item) => `${item.raw} ${item.raw === 1 ? 'película' : 'películas'} · ${percent(item.raw)}%`,
                    },
                },
            },
        },
    });
}

function tooltipStyle() {
    return {
        displayColors: false,
        backgroundColor: token('--color-surface-raised'),
        titleColor: token('--color-text-strong'),
        bodyColor: token('--color-text'),
        borderColor: token('--color-border'),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
    };
}

function buildChartCard({ title, note, rows, tableRows = rows, columnLabel, type = 'bar', horizontal = false, index }) {
    const canvas = h('canvas', {
        role: 'img',
        'aria-label': `${title}. ${tableRows.map((row) => `${row.label}: ${row.count}`).join(', ')}`,
    });

    // horizontal: height grows with the number of bars so they never get squashed
    const height = type === 'pie' ? 300 : horizontal ? Math.max(rows.length * 36, 140) : 220;

    const card = h('figure', { class: 'stats-card' },
        h('figcaption', { class: 'stats-card__title', text: title }),
        note && h('p', { class: 'stats-card__note', text: note }),
        h('div', { class: 'stats-card__chart', style: `height: ${height}px` }, canvas),
        h('details', { class: 'stats-card__table' },
            h('summary', { text: 'Ver como tabla' }),
            h('table', {},
                h('thead', {}, h('tr', {},
                    h('th', { scope: 'col', text: columnLabel }),
                    h('th', { scope: 'col', text: 'Películas' })
                )),
                h('tbody', {}, tableRows.map((row) => h('tr', {},
                    h('th', { scope: 'row', text: row.label }),
                    h('td', { text: String(row.count) })
                )))
            )
        )
    );
    card.style.setProperty('--i', index);
    return { card, canvas, rows, type, horizontal };
}

function renderBarChart(Chart, { canvas, rows, horizontal }) {
    const valueAxis = horizontal ? 'x' : 'y';
    const categoryAxis = horizontal ? 'y' : 'x';
    const muted = token('--color-text-muted');

    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

    return new Chart(canvas, {
        type: 'bar',
        data: {
            labels: rows.map((row) => row.label),
            datasets: [{
                data: rows.map((row) => row.count),
                backgroundColor: token('--color-accent'),
                borderRadius: 4,
                borderSkipped: 'start',   // rounded at the value end, square on the baseline
                maxBarThickness: 24,
            }],
        },
        options: {
            indexAxis: categoryAxis,
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }, // hover anywhere in the bar's row/column
            animation: reducedMotion.matches ? false : {
                duration: 700,
                easing: 'easeOutQuart',
                delay: (context) => (context.type === 'data' && context.mode === 'default' ? context.dataIndex * 70 : 0),
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipStyle(),
                    callbacks: {
                        label: (item) => `${item.raw} ${item.raw === 1 ? 'película' : 'películas'}`,
                    },
                },
            },
            scales: {
                [valueAxis]: {
                    beginAtZero: true,
                    ticks: { precision: 0, color: muted },
                    grid: { color: token('--color-divider') },
                    border: { display: false },
                },
                [categoryAxis]: {
                    ticks: { color: muted },
                    grid: { display: false },
                    border: { color: token('--color-border') },
                },
            },
        },
    });
}

async function openStatsModal(genres) {
    const modal = getDialog();
    const stats = getSavedStats(genres);

    const header = h('header', { class: 'stats-header' },
        h('h2', { class: 'stats-header__title', id: 'stats-title', text: 'Tus estadísticas' }),
        h('p', { class: 'stats-header__subtitle', text: `Basado en ${stats.total} ${stats.total === 1 ? 'película guardada' : 'películas guardadas'}` })
    );

    if (stats.total === 0) {
        body.replaceChildren(header, h('p', { class: 'empty-state', text: 'Guarda alguna película para ver tus estadísticas.' }));
        modal.showModal();
        return;
    }

    // build everything first so the layout doesn't jump when the charts arrive
    const cards = [
        buildChartCard({ title: 'Tus géneros', note: 'Porcentaje sobre todas las etiquetas de género: una película puede tener varios.', rows: stats.genreRows, tableRows: stats.genreTableRows, columnLabel: 'Género', type: 'pie', index: 4 }),
        buildChartCard({ title: 'Por década', rows: stats.decadeRows, columnLabel: 'Década', index: 5 }),
        buildChartCard({ title: 'Distribución de notas', rows: stats.scoreRows, columnLabel: 'Nota', index: 6 }),
    ].filter((card) => card.rows.length > 0);

    body.replaceChildren(
        header,
        buildTiles(stats),
        h('div', { class: 'stats-grid' }, cards.map((item) => item.card))
    );
    body.scrollTop = 0;
    modal.showModal();

    let Chart;
    try {
        Chart = await loadChartJs();
    } catch (error) {
        console.error(error);
        cards.forEach(({ card }) => card.querySelector('details').open = true); // the tables still show everything
        return;
    }
    if (!modal.open) return; // closed while Chart.js was loading

    charts = cards.map((item) => (item.type === 'pie' ? renderPieChart(Chart, item) : renderBarChart(Chart, item)));
}

export { openStatsModal, closeStatsModal };