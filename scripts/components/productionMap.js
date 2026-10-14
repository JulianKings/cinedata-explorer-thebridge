import { h } from '../layoutUtils.js';
import COUNTRY_COORDS from '../data/countryCoords.js';
import { CARTO } from '../data/config.js';

const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const TILES = {
    dark: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO}`,
    light: `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${CARTO}`,
};
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const WORLD_VIEW = [[20, 0], 1];

const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let leaflet = null;
let currentMap = null;
let observer = null;

// UTIL

function loadLeaflet() {
    if (!document.querySelector('link[data-leaflet]')) {
        document.head.append(h('link', { rel: 'stylesheet', href: LEAFLET_CSS, 'data-leaflet': true }));
    }
    leaflet ??= import(LEAFLET_JS).catch((error) => {
        leaflet = null; // retry next time
        throw error;
    });
    return leaflet;
}

function countryName(code, fallback) {
    try {
        const name = regionNames.of(code);
        return name && name !== code ? name : fallback;
    } catch (error) {
        return fallback;
    }
}

function getCoordinates(countries) {
    return countries
        .map(({ code }) => ({ code, latlng: COUNTRY_COORDS[code] ?? null }))
        .filter((point) => point.latlng); // historic codes like 'SU' have no entry
}

// MAP
function destroyProductionMap() {
    observer?.disconnect();
    observer = null;
    currentMap?.remove();
    currentMap = null;
}

async function renderMap(container, countries) {
    let L;
    try {
        L = await loadLeaflet();
    } catch (error) {
        console.error(error);
        container.remove(); // the country tags above still say where
        return;
    }
    if (!container.isConnected) return; // another title was opened meanwhile

    container.classList.remove('is-loading');

    const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const animate = !reducedMotion.matches;
    const located = getCoordinates(countries);

    currentMap = L.map(container, {
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,     // on phones one finger scrolls the modal, not the map
        zoomAnimation: animate,
        fadeAnimation: animate,
        worldCopyJump: true,
    }).setView(...WORLD_VIEW);

    L.tileLayer(TILES[theme], {
        attribution: ATTRIBUTION,
        minZoom: 1,
        maxZoom: 8,
    }).addTo(currentMap);

    located.forEach(({ code, latlng }, index) => {
        const name = countryName(code, countries.find((country) => country.code === code).name);
        const icon = L.divIcon({
            className: 'country-pin',
            html: `<span class="country-pin__dot" style="--i: ${index}"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
        });
        L.marker(latlng, { icon, title: name, alt: name })
            .bindTooltip(h('span', { text: name }), { direction: 'top', offset: [0, -12] })
            .addTo(currentMap);
    });

    const bounds = L.latLngBounds(located.map((point) => point.latlng));
    const fit = { padding: [48, 48], maxZoom: 4 };

    requestAnimationFrame(() => {
        if (!currentMap) return;
        currentMap.invalidateSize();
        if (animate) currentMap.flyToBounds(bounds, { ...fit, duration: 1.4 });
        else currentMap.fitBounds(bounds, fit);
    });
}

// DOM
function buildProductionSection(countries) {
    if (countries.length === 0) return null;

    const located = getCoordinates(countries);
    const mapBox = located.length > 0
        ? h('div', { class: 'production-map is-loading', role: 'region', 'aria-label': 'Mapa de los países de producción' })
        : null;

    const section = h('section', { class: 'details-section', 'aria-labelledby': 'production-title' },
        h('h3', { class: 'details-section__title', id: 'production-title', text: 'Dónde se produjo' }),
        h('ul', { class: 'production-list' },
            countries.map(({ code, name }) => h('li', { class: 'tag', text: countryName(code, name) }))
        ),
        mapBox
    );
    if (!mapBox) return section;

    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        renderMap(mapBox, countries, located);
    }, { rootMargin: '200px' });
    observer.observe(mapBox);

    return section;
}

export { buildProductionSection, destroyProductionMap };