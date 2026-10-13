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

export { h, svg, icon }