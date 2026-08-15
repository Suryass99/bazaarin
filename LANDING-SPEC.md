# Bazaarin — Landing Page Spec (Perspective Run)

A standalone spec for the **new landing page only**. `DESIGN-SPEC.md` covers the other
nine screens and is unaffected by this document.

**How to use this with Google Stitch:** paste **Section 1 (Design System)** first so Stitch
has the palette and shape language, then paste **one frame section at a time** (2A, 2B, or
2C). Stitch generates static screens from text, so the scroll animation is described as
three still frames — 2C is the one that matters most, since it is the frame users act on.
Section 4 holds the motion values for whoever implements it in code.

---

## 1. Design System

### Brand

| Item | Value |
| --- | --- |
| Wordmark | `bazaarin`, always lowercase |
| Wordmark font | Samarkan (fallback: Dancing Script), 2.8rem, normal weight |
| The "in" | Indian tricolor gradient, left to right: `#FF9933` → `#FFFFFF` → `#138808`, applied as a gradient fill on the text only |
| Mark | Orange `#F59E0B` — a ring with an X through it and four dots at N/S/E/W. Rotates 360° every 14s, linear, forever |
| Tagline | `Build for India.` |

### Colour

| Token | Hex | Used for |
| --- | --- | --- |
| Violet (primary strip) | `#6D28D9` | Centre strip, "buy" card |
| Violet deep | `#3B0764` | Gradient end on "buy" card |
| Green (side strips) | `#0D7A53` | Left + right strips, "sell" card |
| Green deep | `#054636` | Gradient end on "sell" card |
| Orange | `#F59E0B` | The rotating mark |
| Page background | `#FFFFFF` | Everything behind the road |
| Text main | `#0F172A` | Headline |
| Text muted | `#475569` | Subtitle, scroll hint |

Header bar gradient, 100°: `#054636` 0% → `#0D7A53` 30% → `#5B21B6` 72% → `#3B0764` 100%.

### Typography

Body font **Outfit** (300–700).

| Element | Size | Weight |
| --- | --- | --- |
| Headline | clamp(1.6rem, 3.4vw, 2.6rem) | 600 |
| Subtitle | 1rem | 400 |
| Scroll hint | 0.8rem, uppercase, 2px letter-spacing | 400 |
| Card title | 1.7rem | 600 |
| Card note | 0.95rem, 82% opacity | 400 |
| Bottom tagline | 0.85rem, uppercase, 3px letter-spacing | 400 |
| Floor lettering | 13vw, 0.4vw letter-spacing | 700 |

### Shape

**Every corner is square. Radius is 0 everywhere — cards, buttons, bars. No rounded
corners anywhere on this page.** Cards carry a soft drop shadow instead:
`0 26px 60px rgba(15, 23, 42, 0.3)`.

### Header

Fixed to the top, full width, the 100° gradient above, ~78px tall. Contents are only:

- Left: the rotating orange mark + `bazaarin` wordmark in white (with the tricolor "in")
- Right: a white three-dot kebab button

Nothing else in the header. The kebab opens a dropdown: Customer Service, Sell an Item,
Seller Dashboard, Logout.

---

## 2. The Screen

One full-viewport scene on a **pure white** background, with no partitions or panels.
Three flat strips lie on the ground in one-point perspective and converge on a vanishing
point at **34% of the viewport height**, dead centre horizontally:

- **Centre strip: violet `#6D28D9`**, the widest of the three
- **Left strip: green `#0D7A53`**
- **Right strip: green `#0D7A53`**

White gaps separate the centre strip from each green one. Two dashed white lane lines run
down the centre strip, converging with it. Near the vanishing point the road fades softly
into white haze rather than ending in a hard edge.

Large faint uppercase words lie flat on the road surface in perspective, like paint on
tarmac — violet at 22% opacity, alternating with green at 22% opacity. They read, in order:
`BUILD FOR INDIA`, `REFURBISHED`, `CERTIFIED`, `SAVE MORE`, `LESS E-WASTE`, `TRUSTED`,
`BUY SMARTER`, `SELL FASTER`.

Scrolling drives a camera that descends toward the road, so the strips spread outward and
fill the frame. Three frames follow.

---

### 2A. Frame 1 — opening (scroll 0%)

The camera is high above the road, so the three strips are pinched into a narrow wedge
rising from the bottom edge of the frame to the vanishing point. The centre violet strip is
about **17% of the frame width** where it meets the bottom edge; the two green strips are
thin bands close in on either side of it. Most of the screen is white.

Centred above the vanishing point, stacked and centre-aligned:

```
India's biggest refurbished market
Certified secondhand laptops and phones, from sellers across the country.
SCROLL  ↓
```

Headline in `#0F172A`, subtitle and hint in `#475569`. The hint is small uppercase text with
a downward chevron that bobs gently up and down.

Directly below that text, sitting on the vanishing point where the road converges: the
orange rotating mark, roughly 96px across.

*(For a returning signed-in buyer, the subtitle instead reads:
`Welcome back, Asha. Pick up where you left off.`)*

---

### 2B. Frame 2 — mid-run (scroll 50%)

The camera has dropped. The road now opens much wider — the violet centre strip is roughly
**40% of the frame width** at the bottom edge, and the two green strips have swung out
toward the left and right corners. The floor lettering is larger and sweeping toward the
viewer.

The headline block has faded away completely. The orange mark has grown to roughly 2.5× its
opening size and still sits on the vanishing point, now the only element in the upper half
of the frame. White space above it, road below it.

---

### 2C. Frame 3 — the choice (scroll 100%) — **primary frame**

The camera is just above the tarmac. The road fills the lower two-thirds of the frame: the
violet centre strip is about **64% of the frame width** at the bottom edge, and the green
strips run off the left and right edges. Two dashed white lane lines converge up the violet.
Above the road, white sky and the road tapering into haze. The orange mark is gone.

Centred at **56% of the viewport height**, two large square-cornered cards sit side by side
with a 26px gap, floating above the road on soft shadows:

**Left card — violet.** Background: 160° gradient `#6D28D9` → `#3B0764`. White text,
left-aligned, ~300px minimum width, 34px/44px padding.

```
I want to buy
Shop certified laptops & mobiles
```

**Right card — green.** Background: 160° gradient `#0D7A53` → `#054636`. Same size, padding
and text treatment.

```
I want to sell
List your device and reach all of India
```

On hover a card lifts 4px and its shadow deepens.

Near the bottom of the frame, centred on the violet strip, in white uppercase with wide
letter-spacing:

```
BUILD FOR INDIA.
```

*(For a returning signed-in buyer the card notes instead read `Browse the full catalogue`
and `List a device of your own`.)*

---

## 3. Mobile (≤720px wide)

Same scene, same colours, same white background. Differences only:

- The two cards **stack vertically**, 16px apart, each about 82% of the screen width, with
  22px/26px padding and a 1.25rem title.
- The headline block starts a little higher (12% of viewport height) so it clears the
  header, and the orange mark is smaller (~84px) so the two never collide.
- The road geometry is unchanged — it is measured in viewport units, so the framing is
  identical to desktop.

---

## 4. Motion (for implementation, not for Stitch)

Stitch will produce static screens; these are the values that turn them into the run.

| Property | Start | End | Notes |
| --- | --- | --- | --- |
| Camera height above road | 2.6 × viewport height | 0.7 × viewport height | The whole effect — a descending camera, **not** a forward dolly. On an infinite road a forward dolly would leave the strip widths unchanged. |
| Floor travel | 0 | −19 × viewport height | Slides the lane dashes and floor words toward the viewer |
| Mark scale | 0.8 | 2.6 | Parked on the vanishing point throughout |
| Perspective depth | 0.75 × viewport height | — | Fixed |
| Vanishing point | 34% of viewport height, centred | — | Fixed |

Scroll timeline over a 340vh scroll container with the scene pinned (sticky) inside it:

| Scroll | Event |
| --- | --- |
| 0% → 26% | Headline block fades out |
| 0% → 75% | Camera descends and floor travels (eased, smoothstep) |
| 48% → 68% | Orange mark fades out |
| 55% → 93% | Choice cards fade in, scaling 0.72 → 1 and rising 90px → 0 |

Geometry, in viewport units on the ground plane: centre strip 68vw wide, side strips 26vw
wide centred at ±53vw, lane lines 0.7vw wide inset 16vw from the centre strip's edges,
dashes 0.8vh long on a 2.4vh period. Floor words sit 2.4vh apart in depth and recycle to the
far end once they pass the camera, so the road never empties. The haze band spans from
14vh above the vanishing point downward for 32vh, solid white for its first 65%.

Under `prefers-reduced-motion` the run collapses to a single screen showing Frame 3.

---

## 5. Behaviour

| Visitor | "I want to buy" goes to | "I want to sell" goes to |
| --- | --- | --- |
| Signed out | Sign-in, buyer role | Sign-in, seller role |
| Signed-in buyer | Shop | Sell |
| Signed-in seller | — redirected to Seller Dashboard on arrival, never sees this page |
| Signed-in staff | — redirected to Admin Dashboard on arrival, never sees this page |

There is no staff login link anywhere on this page; staff reach it through an unlisted URL.
