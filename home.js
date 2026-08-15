// The landing page is a scroll-driven perspective run, and it doubles as the
// login gate. Scroll progress drives a camera that descends toward a ground
// plane carrying three strips (violet centre, green sides); at the end of the
// run the two account choices take the frame. Sellers and admins never see it
// — they go straight to their dashboards.
const landingTrack = document.getElementById('landingTrack');
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
    document.getElementById('choiceBuyNote').textContent = 'Browse the full catalogue';
    document.getElementById('choiceSell').href = 'sell.html';
    document.getElementById('choiceSellNote').textContent = 'List a device of your own';
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
const RUN_END = 0.75;    // scroll fraction at which the camera stops moving

const floorWords = Array.from(document.querySelectorAll('.floor-word'));
const trackChoice = document.getElementById('trackChoice');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);

function drawTrack(progress) {
    const vh = window.innerHeight;
    const run = smoothstep(clamp(progress / RUN_END, 0, 1));
    const travel = -TRAVEL * vh * run;

    trackStage.style.setProperty('--cam-y', lerp(CAM_HIGH, CAM_LOW, run) * vh + 'px');
    trackStage.style.setProperty('--travel', travel + 'px');

    // The mark grows with the approach, then hands the frame to the choices.
    const handover = clamp((progress - 0.48) / 0.2, 0, 1);
    trackStage.style.setProperty('--logo-scale', lerp(0.8, 2.6, run));
    trackStage.style.setProperty('--logo-drop', lerp(0, 30, run) + 'px');
    trackStage.style.setProperty('--logo-opacity', 1 - handover);

    trackStage.style.setProperty('--intro-opacity', 1 - clamp(progress / 0.26, 0, 1));

    const choice = smoothstep(clamp((progress - 0.55) / 0.38, 0, 1));
    trackStage.style.setProperty('--choice-opacity', choice);
    trackStage.style.setProperty('--choice-scale', lerp(0.72, 1, choice));
    trackStage.style.setProperty('--choice-rise', lerp(90, 0, choice) + 'px');
    trackChoice.dataset.idle = choice < 0.5 ? 'true' : 'false';

    // Words are carried toward the camera by --travel and recycled to the far
    // end of the run once they pass it, so the road never empties out. A word
    // that reaches the eye plane projects to nonsense, so each one fades out
    // over the last stretch before it gets there — and fades back in at the
    // far end, where the haze hides it anyway.
    const span = floorWords.length * WORD_GAP * vh;
    const fadeFrom = DEPTH * vh * 0.4;
    const fadeTo = DEPTH * vh * 1.6;
    floorWords.forEach((word, i) => {
        const y = (((i * WORD_GAP * vh + travel) % span) + span) % span;
        word.style.transform = `translateY(${y}px)`;
        word.style.opacity = clamp((y - fadeFrom) / (fadeTo - fadeFrom), 0, 1);
    });
}

if (reduceMotion) {
    drawTrack(1);
} else {
    let queued = false;
    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            const span = landingTrack.offsetHeight - window.innerHeight;
            const progress = span > 0
                ? clamp(-landingTrack.getBoundingClientRect().top / span, 0, 1)
                : 1;
            drawTrack(progress);
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
}

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
