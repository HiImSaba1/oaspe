# OASPE Design System

## Reference boundary

The Sabaweb project supplies interaction and layout patterns only. OASPE does not reuse its logo, brand text, records or identity.

## Inverted palette

- Canvas: ivory `#f1eee8`
- Primary ink: near-black `#0a0a0a`
- Raised light surface: `#ffffff`
- Dark section: `#101207`
- Muted ink: `#66635e`
- Hairline: black at 14% opacity
- Accent: lime `#d7ff4f`

## Layout tokens

- Page gutter: `clamp(1.25rem, 3vw, 3.75rem)`
- Section spacing: `clamp(4.5rem, 10vw, 12rem)`
- Header: fixed, 5.5rem desktop shell
- Greek hero heading: approximately `clamp(2.9rem, 9.5cqi, 8rem)`
- Mobile display heading: `clamp(2.65rem, 12vw, 4rem)`

## Motion contract

- GSAP SplitText for word or line masks.
- Text entrance uses `yPercent: 110`, `expo.out`, and clears transform state.
- Parallax images use an oversized inner media wrapper and `scrub: 0.7`.
- Menu reveals through a clipped full-screen panel with staged navigation and metadata.
- Lenis owns smooth wheel scrolling.
- All effects become static when `prefers-reduced-motion: reduce` is active.
- The initial preloader, page curtain, route-ready event, Lenis lifecycle and
  SplitText entrances operate as one coordinated system.
- Every internal navigation surface uses `TransitionLink`; external, mail,
  telephone, hash and modified-click navigation bypasses the curtain.

## Shared surfaces

- Every primary page opens with the same full-viewport, image-backed hero
  system used by the homepage; contact retains the reference three-line hero.
- The footer uses the reference clipped reveal, navigation/contact grid and
  oversized OASPE wordmark treatment.

## Image contract

Every `fill` image has an explicitly sized parent. Above-the-fold images may be priority-loaded; later media remains lazy. Legacy WordPress URLs are temporary until local media import is certified.
