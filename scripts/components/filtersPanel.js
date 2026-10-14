import { h, icon } from '../layoutUtils.js';

const LANGUAGES = ['es', 'en', 'fr', 'it', 'de', 'ja', 'ko', 'hi'];
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 2;
const EMPTY = { genres: [], genreMode: 'all', yearFrom: null, yearTo: null, minScore: 0, language: '', sort: 'popularity' };

const languageNames = new Intl.DisplayNames(['es'], { type: 'language' });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let dialog = null;
let body = null;
let options = null;

// UTIL
const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);
const languageName = (code) => capitalize(languageNames.of(code));

function isEmpty(filters) {
    return filters.genres.length === 0 && !filters.yearFrom && !filters.yearTo
        && !filters.minScore && !filters.language && filters.sort === 'popularity';
}

function readFilters(form) {
    const data = new FormData(form);
    const year = (name) => {
        const value = Number(data.get(name));
        return value >= MIN_YEAR && value <= MAX_YEAR ? value : null;
    };
    let yearFrom = year('yearFrom');
    let yearTo = year('yearTo');
    if (yearFrom && yearTo && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]; // forgive swapped years

    return {
        genres: data.getAll('genre').map(Number),
        genreMode: data.get('genreMode') === 'any' ? 'any' : 'all',
        yearFrom,
        yearTo,
        minScore: Number(data.get('minScore')) || 0,
        language: data.get('language') ?? '',
        sort: data.get('sort') ?? 'popularity',
    };
}

function describeFilters(filters, genres) {
    const parts = [];
    const names = filters.genres.map((id) => genres.find((genre) => genre.id === id)?.name).filter(Boolean);
    if (names.length) parts.push(names.join(filters.genreMode === 'any' ? ' o ' : ', '));

    const { yearFrom: from, yearTo: to } = filters;
    if (from && to) parts.push(from === to ? `${from}` : `${from}–${to}`);
    else if (from) parts.push(`Desde ${from}`);
    else if (to) parts.push(`Hasta ${to}`);

    if (filters.minScore) parts.push(`★ ${filters.minScore}+`);
    if (filters.language) parts.push(languageName(filters.language));
    return parts.join(' · ') || 'Todos los títulos';
}

// DOM
function field(label, ...controls) {
    return h('fieldset', { class: 'filters__field' },
        h('legend', { class: 'filters__label', text: label }),
        ...controls
    );
}

function radio(name, value, label, checked) {
    return h('label', { class: 'filters__radio' },
        h('input', { type: 'radio', name, value, checked }),
        h('span', { text: label })
    );
}

function select(name, label, choices, current) {
    return h('select', { class: 'filters__input', name, 'aria-label': label },
        choices.map(([value, text]) => h('option', { value, text, selected: value === current }))
    );
}

function buildForm({ filters, genres, local }) {
    const current = filters ?? EMPTY;

    const scoreValue = h('output', { class: 'filters__score-value', for: 'filter-score' });
    const showScore = (value) => {
        scoreValue.textContent = Number(value) ? `★ ${value}+` : 'Cualquiera';
    };
    showScore(current.minScore);

    const form = h('form', { class: 'filters', novalidate: true },
        h('h2', { class: 'filters__title', id: 'filters-title', text: 'Búsqueda avanzada' }),

        field('Géneros',
            h('div', { class: 'filters__genres' },
                genres.map((genre) => h('label', { class: 'filter-chip' },
                    h('input', { type: 'checkbox', name: 'genre', value: genre.id, checked: current.genres.includes(genre.id) }),
                    h('span', { text: genre.name })
                ))
            ),
            h('div', { class: 'filters__row' },
                radio('genreMode', 'all', 'Todos los marcados', current.genreMode !== 'any'),
                radio('genreMode', 'any', 'Cualquiera de ellos', current.genreMode === 'any')
            )
        ),

        field('Años',
            h('div', { class: 'filters__row' },
                h('input', { class: 'filters__input', type: 'number', name: 'yearFrom', min: MIN_YEAR, max: MAX_YEAR, placeholder: 'Desde', 'aria-label': 'Desde el año', value: current.yearFrom ?? '' }),
                h('span', { class: 'filters__dash', 'aria-hidden': 'true', text: '–' }),
                h('input', { class: 'filters__input', type: 'number', name: 'yearTo', min: MIN_YEAR, max: MAX_YEAR, placeholder: 'Hasta', 'aria-label': 'Hasta el año', value: current.yearTo ?? '' })
            )
        ),

        field('Nota mínima',
            h('div', { class: 'filters__row' },
                h('input', {
                    class: 'filters__range', type: 'range', id: 'filter-score', name: 'minScore',
                    min: 0, max: 9, step: 0.5, value: current.minScore,
                    onInput: (event) => showScore(event.target.value),
                }),
                scoreValue
            )
        ),

        h('div', { class: 'filters__pair' },
            !local && field('Idioma original',
                select('language', 'Idioma original',
                    [['', 'Cualquiera'], ...LANGUAGES.map((code) => [code, languageName(code)])],
                    current.language)
            ),

            field('Ordenar por',
                select('sort', 'Ordenar por', [
                    ['popularity', local ? 'Guardadas recientemente' : 'Más populares'],
                    ['score', 'Mejor valoradas'],
                    ['date', 'Más recientes'],
                ], current.sort)
            )
        ),

        h('div', { class: 'filters__actions' },
            h('button', { class: 'btn btn--soft', type: 'button', text: 'Restablecer', onClick: () => renderForm({ ...options, filters: null }) }),
            h('button', { class: 'btn btn--primary', type: 'submit', text: 'Aplicar' })
        )
    );

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const filters = readFilters(form);
        closeFiltersPanel();
        options.onApply(isEmpty(filters) ? null : filters); // nothing set = clear the filters
    });

    return form;
}

function renderForm(formOptions) {
    body.replaceChildren(buildForm(formOptions));
}

function getDialog() {
    if (dialog) return dialog;

    body = h('div', { class: 'filters-modal__body' });
    dialog = h('dialog', { class: 'movie-modal filters-modal', 'aria-labelledby': 'filters-title' },
        h('button', {
            class: 'btn btn--icon movie-modal__close',
            type: 'button',
            'aria-label': 'Cerrar',
            onClick: () => closeFiltersPanel(),
        }, icon('close', 'btn__icon')),
        body
    );

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeFiltersPanel();
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeFiltersPanel();
    });

    document.body.appendChild(dialog);
    return dialog;
}

function openFiltersPanel(panelOptions) {
    options = panelOptions;
    getDialog();
    renderForm(options);
    dialog.showModal();
}

function closeFiltersPanel() {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;

    const finish = () => {
        dialog.classList.remove('is-closing');
        dialog.close();
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

export { openFiltersPanel, describeFilters };
