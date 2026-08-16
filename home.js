// The landing page is a perspective run that plays itself on load, and it
// doubles as the login gate. A camera descends toward a ground plane carrying
// three strips (violet centre, green sides); when the run settles, the two
// account choices take the frame. Sellers and admins never see it — they go
// straight to their dashboards.
const trackStage = document.getElementById('trackStage');

const homeUser = getCurrentUser();
if (homeUser && homeUser.accountType === 'seller') {
    window.location.href = 'seller.html';
} else if (homeUser && homeUser.accountType === 'admin') {
    window.location.href = 'admin.html';
}

// A signed-in buyer already has an account, so their choices skip the sign-in
// step and go straight to the relevant page.
if (homeUser && homeUser.accountType === 'customer') {
    document.getElementById('trackSub').textContent =
        `Welcome back, ${homeUser.name}. Pick up where you left off.`;
    const buy = document.getElementById('choiceBuy');
    buy.href = 'shop.html';
    document.getElementById('choiceBuyNote').textContent =
        'Browse the full catalogue of tested, certified devices.';
    document.getElementById('choiceSell').href = 'sell.html';
    document.getElementById('choiceSellNote').textContent =
        'List a device of your own and reach buyers across India.';
}

// --- The run -----------------------------------------------------------
// --cam-y is the on-screen distance between the horizon and the near edge of
// the ground plane, i.e. camera height: a large value keeps the camera high
// and the strips pinched together, a small one drops it to the tarmac and
// throws the strips out past the edges of the frame. --travel slides the lane
// dashes and the floor lettering along the plane for forward motion.
// Every distance below is a multiple of the viewport height so the run frames
// itself identically on a phone and on a desktop.
const CAM_HIGH = 2.6;    // camera height at the start of the run
const CAM_LOW = 0.7;     // camera height at the end (just above the tarmac)
const DEPTH = 0.75;      // must match `perspective` on .track-stage
const TRAVEL = 19;       // distance the floor slides toward the camera
const WORD_GAP = 2.4;    // spacing between floor words along the plane
const RUN_END = 0.75;    // point in the run at which the camera stops moving

// The run plays itself on load rather than being driven by scroll.
const RUN_DURATION = 3400; // ms of camera movement
const RUN_HOLD = 300;      // ms held on the opening frame before it starts

// Everything the per-frame path touches is resolved once, up front: a
// querySelector or a getElementById inside drawTrack costs a frame budget it
// doesn't need to spend.
const floorWords = Array.from(document.querySelectorAll('.floor-word'));
const trackChoice = document.getElementById('trackChoice');
const trackStyle = trackStage.style;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Viewport height is cached too — reading innerHeight every frame is a
// forced layout. Refreshed on resize.
let viewH = window.innerHeight;
let choiceIdle = null;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);

function drawTrack(progress) {
    const vh = viewH;
    const run = smoothstep(clamp(progress / RUN_END, 0, 1));
    const travel = -TRAVEL * vh * run;

    trackStyle.setProperty('--cam-y', lerp(CAM_HIGH, CAM_LOW, run) * vh + 'px');
    trackStyle.setProperty('--travel', travel + 'px');

    // The mark grows with the approach, then hands the frame to the choices.
    const handover = clamp((progress - 0.48) / 0.2, 0, 1);
    trackStyle.setProperty('--logo-scale', lerp(0.8, 2.6, run));
    trackStyle.setProperty('--logo-drop', lerp(0, 30, run) + 'px');
    trackStyle.setProperty('--logo-opacity', 1 - handover);

    trackStyle.setProperty('--intro-opacity', 1 - clamp(progress / 0.26, 0, 1));

    const choice = smoothstep(clamp((progress - 0.55) / 0.38, 0, 1));
    trackStyle.setProperty('--choice-opacity', choice);
    trackStyle.setProperty('--choice-scale', lerp(0.72, 1, choice));
    trackStyle.setProperty('--choice-rise', lerp(90, 0, choice) + 'px');

    // Writing this attribute every frame invalidates style on the subtree for
    // no reason; it only ever changes once during the run.
    const idle = choice < 0.5;
    if (idle !== choiceIdle) {
        choiceIdle = idle;
        trackChoice.dataset.idle = idle ? 'true' : 'false';
    }

    // Words are carried toward the camera by --travel and recycled to the far
    // end of the run once they pass it, so the road never empties out. A word
    // that reaches the eye plane projects to nonsense, so each one fades out
    // over the last stretch before it gets there — and fades back in at the
    // far end, where the haze hides it anyway.
    const span = floorWords.length * WORD_GAP * vh;
    const fadeFrom = DEPTH * vh * 0.4;
    const fadeTo = DEPTH * vh * 1.6;
    const fadeSpan = fadeTo - fadeFrom;
    for (let i = 0; i < floorWords.length; i++) {
        const word = floorWords[i];
        const y = (((i * WORD_GAP * vh + travel) % span) + span) % span;
        // translate3d keeps each word on its own composited layer.
        word.style.transform = `translate3d(0, ${y}px, 0)`;
        word.style.opacity = clamp((y - fadeFrom) / fadeSpan, 0, 1);
    }
}

// Remember where the run got to, so a resize can redraw the same frame at
// the new viewport size instead of snapping.
let runProgress = 0;

function paint(progress) {
    runProgress = progress;
    drawTrack(progress);
}

if (reduceMotion) {
    paint(1);
} else {
    paint(0);
    // The clock starts on the first frame actually served rather than at
    // parse time, so a page opened in a background tab still plays the run
    // when it's brought forward instead of snapping to the finished frame.
    let start = null;
    const step = (now) => {
        if (start === null) start = now;
        const t = clamp((now - start - RUN_HOLD) / RUN_DURATION, 0, 1);
        paint(t);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

let resizeTimer = null;
window.addEventListener('resize', () => {
    viewH = window.innerHeight;
    paint(runProgress);
    // Re-fill the sky only once the resize settles — widening the window can
    // leave a row too short to loop without a gap.
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fillSky, 200);
});

// --- Sky ---------------------------------------------------------------
// Laptop and phone outlines drifting across the open space above the road.
// Each row's content is duplicated so the -50% keyframe loops seamlessly.
const SKY_LAPTOP = `<svg width="46" height="34" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="20" height="12" rx="1.5"/><path d="M1 16h22l-1.6 2.4a1 1 0 0 1-.9.6H3.5a1 1 0 0 1-.9-.6L1 16z"/></svg>`;
const SKY_MOBILE = `<svg width="24" height="36" viewBox="0 0 16 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="12" height="22" rx="2.5"/><line x1="6.5" y1="19.5" x2="9.5" y2="19.5"/></svg>`;

function skyRunHtml(startWithLaptop) {
    let html = '';
    for (let i = 0; i < 7; i++) {
        const laptop = startWithLaptop ? i % 2 === 0 : i % 2 === 1;
        const tint = i % 3 === 0 ? 'sky-green' : 'sky-violet';
        html += `<span class="${tint}">${laptop ? SKY_LAPTOP : SKY_MOBILE}</span>`;
    }
    return html;
}

const SKY_ROWS = [['skyTrack1', true], ['skyTrack2', false], ['skyTrack3', true]];

// The -50% keyframe scrolls exactly one copy of the row, so a single copy has
// to be at least as wide as the viewport or the loop shows a gap. Grow the
// run until it covers the screen, then duplicate it.
function fillSkyRow(el, laptopFirst) {
    const one = skyRunHtml(laptopFirst);
    let html = one;
    el.innerHTML = html;
    let guard = 0;
    while (el.getBoundingClientRect().width < window.innerWidth && guard++ < 8) {
        html += one;
        el.innerHTML = html;
    }
    el.innerHTML = html + html;
}

function fillSky() {
    SKY_ROWS.forEach(([id, laptopFirst]) => {
        const el = document.getElementById(id);
        if (el) fillSkyRow(el, laptopFirst);
    });
}

fillSky();

// Dropdown Menu Logic
function toggleMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
}
window.onclick = function(event) {
    if (!event.target.closest('.kebab-menu')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
