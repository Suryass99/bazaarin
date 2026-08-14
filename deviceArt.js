// Self-made product photography.
//
// There's no camera and no stock library here, so every listing's "photos"
// are generated as SVG illustrations instead — deterministically seeded from
// the product id so the same listing always renders the same images (and no
// two listings ever collide), but brand-appropriate in color and shape so
// the picture matches the spec sheet next to it.
(function () {
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hashSeed(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function angleOffset(angle) {
        const map = { open: 1, closed: 2, keyboard: 3, front: 11, back: 12, held: 13 };
        return (map[angle] || 0) * 7919;
    }

    function luminance(hex) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    // Wordmark/etch color that stays legible whether the chassis is light
    // (Apple's silver) or dark (most gaming laptops).
    function wordmarkColor(bodyHex) {
        return luminance(bodyHex) > 0.55 ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.55)';
    }

    function svgToDataUri(svg) {
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    function wrapSvg(w, h, inner) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
    }

    const LAPTOP_PALETTES = {
        Apple:  { body: '#d6d8da', dark: '#9ea3a8', screenA: '#1e3a8a', screenB: '#38bdf8' },
        Asus:   { body: '#17181a', dark: '#050506', screenA: '#7f1d1d', screenB: '#111827' },
        Lenovo: { body: '#141517', dark: '#000000', screenA: '#0f172a', screenB: '#1e3a8a' },
        Dell:   { body: '#c9cbce', dark: '#8b8f94', screenA: '#0f172a', screenB: '#2563eb' },
        HP:     { body: '#2c2620', dark: '#171310', screenA: '#1e1b4b', screenB: '#6d28d9' },
        Acer:   { body: '#1a1c1f', dark: '#020203', screenA: '#052e2b', screenB: '#0891b2' },
        MSI:    { body: '#2b2b2f', dark: '#131316', screenA: '#1e1033', screenB: '#7c3aed' }
    };

    const MOBILE_PALETTES = {
        Apple:   { body: '#e2e4e6', dark: '#aeb2b6', screenA: '#1d4ed8', screenB: '#38bdf8' },
        Samsung: { body: '#0f1b2d', dark: '#000000', screenA: '#4c1d95', screenB: '#7c3aed' },
        OnePlus: { body: '#111113', dark: '#000000', screenA: '#7f1d1d', screenB: '#dc2626' },
        Nothing: { body: '#f2f2f2', dark: '#c7c7c7', screenA: '#0b0b0b', screenB: '#2c2c2c' },
        iQOO:    { body: '#0c1a2b', dark: '#000000', screenA: '#083344', screenB: '#06b6d4' },
        Vivo:    { body: '#1a1f3d', dark: '#05070f', screenA: '#1e3a8a', screenB: '#3b82f6' },
        Oppo:    { body: '#0b6e5a', dark: '#04352a', screenA: '#064e3b', screenB: '#10b981' },
        HTC:     { body: '#3a3a3a', dark: '#1c1c1c', screenA: '#334155', screenB: '#64748b' },
        Redmi:   { body: '#13233f', dark: '#050b16', screenA: '#7c2d12', screenB: '#f97316' }
    };

    function scratches(rand, count, w, h) {
        let s = '';
        for (let i = 0; i < count; i++) {
            const x1 = rand() * w, y1 = rand() * h;
            const len = 20 + rand() * 60;
            const ang = rand() * Math.PI;
            const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
            s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="white" stroke-opacity="${(0.05 + rand() * 0.1).toFixed(2)}" stroke-width="${(1 + rand()).toFixed(1)}" stroke-linecap="round"/>`;
        }
        return s;
    }

    function screenContent(rand, x, y, w, h, palette, rId) {
        let icons = '';
        const cols = 4, rows = 2;
        const pad = w * 0.08;
        const cellW = (w - pad * 2) / cols;
        const cellH = (h * 0.42) / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (rand() > 0.25) {
                    const ix = x + pad + c * cellW + cellW * 0.2;
                    const iy = y + h * 0.5 + r * cellH + cellH * 0.15;
                    const size = Math.min(cellW, cellH) * 0.55;
                    icons += `<rect x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.28).toFixed(1)}" fill="rgba(255,255,255,${(0.5 + rand() * 0.4).toFixed(2)})"/>`;
                }
            }
        }
        return `
            <defs><linearGradient id="scr${rId}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="${palette.screenA}"/>
                <stop offset="1" stop-color="${palette.screenB}"/>
            </linearGradient></defs>
            <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#scr${rId})"/>
            <rect x="${x}" y="${y}" width="${w}" height="${(h * 0.12).toFixed(1)}" fill="rgba(0,0,0,0.15)"/>
            ${icons}
        `;
    }

    function keyboardGrid(rand, x, y, w, h) {
        let out = '';
        const cols = 12, rows = 4;
        const gap = 4;
        const cw = (w - gap * (cols - 1)) / cols;
        const ch = (h - gap * (rows - 1)) / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const kx = x + c * (cw + gap);
                const ky = y + r * (ch + gap);
                out += `<rect x="${kx.toFixed(1)}" y="${ky.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="3" fill="#000" opacity="${(0.35 + rand() * 0.15).toFixed(2)}"/>`;
            }
        }
        return out;
    }

    function laptopSVG(seed, palette, angle, brand) {
        const rand = mulberry32(seed + angleOffset(angle));
        const W = 480, H = 480;
        const deskTone = `hsl(${Math.floor(rand() * 360)},12%,${88 + rand() * 6}%)`;
        let body;

        if (angle === 'open') {
            const baseY = 300, baseH = 60, baseW = 340, baseX = (W - baseW) / 2;
            const screenW = 320, screenH = 200, screenX = (W - screenW) / 2, screenY = baseY - screenH + 14;
            body = `
                <rect x="0" y="0" width="${W}" height="${H}" fill="${deskTone}"/>
                <ellipse cx="${W / 2}" cy="${baseY + baseH + 10}" rx="190" ry="18" fill="black" opacity="0.12"/>
                <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="10" fill="${palette.dark}"/>
                <rect x="${screenX + 8}" y="${screenY + 8}" width="${screenW - 16}" height="${screenH - 16}" rx="4" fill="#000"/>
                ${screenContent(rand, screenX + 8, screenY + 8, screenW - 16, screenH - 16, palette, 1)}
                <rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" rx="8" fill="${palette.body}"/>
                <rect x="${baseX + baseW / 2 - 45}" y="${baseY + 10}" width="90" height="34" rx="6" fill="${palette.dark}" opacity="0.5"/>
                ${scratches(rand, 5, W, H)}
            `;
        } else if (angle === 'closed') {
            const lidW = 300, lidH = 210, lidX = (W - lidW) / 2, lidY = (H - lidH) / 2;
            body = `
                <rect x="0" y="0" width="${W}" height="${H}" fill="${deskTone}"/>
                <ellipse cx="${W / 2}" cy="${lidY + lidH + 20}" rx="170" ry="16" fill="black" opacity="0.12"/>
                <rect x="${lidX}" y="${lidY}" width="${lidW}" height="${lidH}" rx="14" fill="${palette.body}"/>
                <rect x="${lidX}" y="${lidY}" width="${lidW}" height="${lidH}" rx="14" fill="white" opacity="0.06"/>
                <text x="${W / 2}" y="${lidY + lidH / 2}" font-family="Arial, sans-serif" font-size="20" fill="${wordmarkColor(palette.body)}" text-anchor="middle">${brand}</text>
                ${scratches(rand, 6, W, H)}
            `;
        } else {
            body = `
                <rect x="0" y="0" width="${W}" height="${H}" fill="${deskTone}"/>
                <rect x="20" y="40" width="440" height="300" rx="16" fill="${palette.body}"/>
                ${keyboardGrid(rand, 50, 70, 380, 160)}
                <rect x="${W / 2 - 70}" y="260" width="140" height="90" rx="14" fill="${palette.dark}" opacity="0.35"/>
                <circle cx="130" cy="415" r="30" fill="#fff" opacity="0.7"/>
                <rect x="115" y="405" width="30" height="42" rx="4" fill="#8b5e34" opacity="0.6"/>
                ${scratches(rand, 8, W, H)}
            `;
        }
        return wrapSvg(W, H, body);
    }

    function heldPhoneSVG(rand, palette) {
        const W = 480, H = 480;
        const bgHue = Math.floor(rand() * 360);
        let bokeh = '';
        for (let i = 0; i < 6; i++) {
            const cx = rand() * W, cy = rand() * H * 0.6, r = 40 + rand() * 70;
            bokeh += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="hsl(${(bgHue + rand() * 60).toFixed(0)},60%,${(55 + rand() * 20).toFixed(0)}%)" opacity="${(0.15 + rand() * 0.15).toFixed(2)}"/>`;
        }
        const pw = 150, ph = 300;
        const cx = W / 2 - 10, cy = H / 2 + 6;
        const rot = (-8 + rand() * 16).toFixed(1);
        const skin = `hsl(28, ${40 + rand() * 10}%, ${55 + rand() * 15}%)`;
        return `
            <rect x="0" y="0" width="${W}" height="${H}" fill="hsl(${bgHue},25%,80%)"/>
            ${bokeh}
            <g transform="translate(${cx},${cy}) rotate(${rot})">
                <rect x="${-pw / 2 - 6}" y="${-ph / 2 - 6}" width="${pw + 12}" height="${ph + 12}" rx="26" fill="${palette.body}"/>
                <rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="20" fill="#000"/>
                ${screenContent(rand, -pw / 2 + 5, -ph / 2 + 5, pw - 10, ph - 10, palette, 3)}
                <circle cx="0" cy="${-ph / 2 + 16}" r="4" fill="#111"/>
                <path d="M ${pw / 2 - 4} ${-ph / 2 + 50} q 58 8 58 62 v 66 q 0 42 -52 42 h -10 v -170 z" fill="${skin}"/>
                <path d="M ${pw / 2 - 4} ${-ph / 2 + 128} q 62 4 62 52 q 0 46 -58 46 h -6 z" fill="${skin}" opacity="0.95"/>
                <path d="M ${-pw / 2 + 14} ${ph / 2 - 74} q -42 -8 -52 32 q -8 30 32 44 q 60 14 88 -18 z" fill="${skin}"/>
            </g>
        `;
    }

    function mobileSVG(seed, palette, angle, brand) {
        const rand = mulberry32(seed + angleOffset(angle));
        const W = 480, H = 480;
        let body;

        if (angle === 'front') {
            const pw = 200, ph = 400, px = (W - pw) / 2, py = (H - ph) / 2;
            body = `
                <rect x="0" y="0" width="${W}" height="${H}" fill="hsl(${Math.floor(rand() * 360)},10%,90%)"/>
                <ellipse cx="${W / 2}" cy="${py + ph + 14}" rx="110" ry="14" fill="black" opacity="0.12"/>
                <rect x="${px - 8}" y="${py - 8}" width="${pw + 16}" height="${ph + 16}" rx="34" fill="${palette.body}"/>
                <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="26" fill="#000"/>
                ${screenContent(rand, px + 6, py + 6, pw - 12, ph - 12, palette, 2)}
                <circle cx="${W / 2}" cy="${py + 22}" r="5" fill="#111"/>
                <rect x="${W / 2 - 30}" y="${py + ph - 14}" width="60" height="5" rx="2.5" fill="#fff" opacity="0.6"/>
                ${scratches(rand, 4, W, H)}
            `;
        } else if (angle === 'back') {
            const pw = 200, ph = 400, px = (W - pw) / 2, py = (H - ph) / 2;
            body = `
                <rect x="0" y="0" width="${W}" height="${H}" fill="hsl(${Math.floor(rand() * 360)},10%,90%)"/>
                <ellipse cx="${W / 2}" cy="${py + ph + 14}" rx="110" ry="14" fill="black" opacity="0.12"/>
                <rect x="${px - 8}" y="${py - 8}" width="${pw + 16}" height="${ph + 16}" rx="34" fill="${palette.body}"/>
                <rect x="${px - 8}" y="${py - 8}" width="${pw + 16}" height="${ph + 16}" rx="34" fill="white" opacity="0.05"/>
                <rect x="${px + 18}" y="${py + 24}" width="60" height="60" rx="16" fill="${palette.dark}" opacity="0.6"/>
                <circle cx="${px + 38}" cy="${py + 44}" r="12" fill="#111"/>
                <circle cx="${px + 66}" cy="${py + 44}" r="12" fill="#111"/>
                <circle cx="${px + 38}" cy="${py + 70}" r="12" fill="#111"/>
                <circle cx="${px + 52}" cy="${py + 34}" r="4" fill="#fbbf24"/>
                <text x="${px + pw / 2}" y="${py + ph - 30}" font-family="Arial, sans-serif" font-size="13" fill="${wordmarkColor(palette.body)}" text-anchor="middle">${brand}</text>
                ${scratches(rand, 5, W, H)}
            `;
        } else {
            body = heldPhoneSVG(rand, palette);
        }
        return wrapSvg(W, H, body);
    }

    function paletteFor(product) {
        const table = product.category === 'Laptops' ? LAPTOP_PALETTES : MOBILE_PALETTES;
        return table[product.brand] || { body: '#333', dark: '#111', screenA: '#333', screenB: '#666' };
    }

    function getProductImages(product) {
        // Seller-submitted listings carry their own photo (live capture or
        // upload) — show that instead of generated art.
        if (product.userImage) {
            return [{ label: 'Seller photo', src: product.userImage }];
        }
        const seed = hashSeed(product.id + '|' + product.title);
        const palette = paletteFor(product);
        if (product.category === 'Laptops') {
            return [
                { label: 'Open — front view', src: svgToDataUri(laptopSVG(seed, palette, 'open', product.brand)) },
                { label: 'Closed lid', src: svgToDataUri(laptopSVG(seed, palette, 'closed', product.brand)) },
                { label: 'Keyboard close-up', src: svgToDataUri(laptopSVG(seed, palette, 'keyboard', product.brand)) }
            ];
        }
        return [
            { label: 'Screen on', src: svgToDataUri(mobileSVG(seed, palette, 'front', product.brand)) },
            { label: 'Back panel', src: svgToDataUri(mobileSVG(seed, palette, 'back', product.brand)) },
            { label: 'Held in hand', src: svgToDataUri(mobileSVG(seed, palette, 'held', product.brand)) }
        ];
    }

    function getProductThumbnail(product) {
        if (product.userImage) return product.userImage;
        const images = getProductImages(product);
        if (product.category === 'Mobiles' && product.id % 2 === 0) {
            return images[2].src;
        }
        return images[0].src;
    }

    window.getProductImages = getProductImages;
    window.getProductThumbnail = getProductThumbnail;
})();
