const IMAGE_URL = 'https://image.tmdb.org/t/p/';
const HERO_IMAGE_TYPE = 'poster';
const IMAGE_BREAKPOINTS = {
    poster: [
        { from: 0, size: 'w500' },
        { from: 600, size: 'w780' },
        { from: 1450, size: 'original' },
    ],
    backdrop: [
        { from: 0, size: 'w780' },
        { from: 1400, size: 'w1280' },
        { from: 2400, size: 'original' },
    ],
};


function validImagePath(path) {
    return typeof path === 'string' && /^\/[\w.-]+\.(jpe?g|png|svg)$/i.test(path) ? path : null;
}

function imageUrl(path, size = 'w500') {
    const safePath = validImagePath(path);
    if (!safePath || !/^(w\d+|original)$/.test(size)) return null;
    return `${IMAGE_URL}${size}${safePath}`;
}

function getScreenPixels() {
    return window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
}

function pickImageSize(type) {
    const screenPixels = getScreenPixels();
    let size = IMAGE_BREAKPOINTS[type][0].size;
    IMAGE_BREAKPOINTS[type].forEach((step) => {
        if (screenPixels >= step.from) size = step.size;
    });
    return size;
}

function getHeroImageUrl(movie) {
    const otherType = HERO_IMAGE_TYPE === 'poster' ? 'backdrop' : 'poster';
    const type = movie[`${HERO_IMAGE_TYPE}Path`] ? HERO_IMAGE_TYPE : otherType;
    const path = movie[`${type}Path`];
    if (!path) return null;
    return imageUrl(path, pickImageSize(type));
}

export { getHeroImageUrl, imageUrl };