const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttrs(node, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (key === 'text') {
            node.textContent = value;
        } else if (key === 'hidden') {
            node.hidden = Boolean(value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            node.setAttribute(key, value === true ? '' : value);
        }
    }
}

function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
}

function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    applyAttrs(node, attrs);
    node.append(...children.flat().filter((child) => child != null && child !== false));
    return node;
}

function icon(name, classes = '') {
    return svg(
        'svg',
        { class: `icon ${classes}`.trim(), 'aria-hidden': 'true' },
        svg('use', { href: `#icon-${name}` })
    );
}

function dotsIcon(classes = '') {
    return svg('svg', { class: `icon icon--filled details-dots ${classes}`.trim(), viewBox: '0 0 24 24', 'aria-hidden': 'true' },
        [5, 12, 19].map((cx) => svg('circle', { cx, cy: 12, r: 1.8 }))
    );
}

const BOOKMARK_PATH = 'M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z';

function bookmarkIcon(classes = '') {
    return svg('svg', { class: `icon bookmark-icon ${classes}`.trim(), viewBox: '0 0 24 24', 'aria-hidden': 'true' },
        svg('path', { class: 'bookmark-icon__fill', d: BOOKMARK_PATH }),
        svg('path', { class: 'bookmark-icon__outline', d: BOOKMARK_PATH })
    );
}

function setBookmarkState(button, saved) {
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', saved ? 'Quitar de guardadas' : 'Guardar película');
}

export { h, svg, icon, dotsIcon, bookmarkIcon, setBookmarkState };