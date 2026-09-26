// Everyday design system (see docs/DESIGN.md).
// Colours: Radix Colors 3.0 (MIT) — sand (neutral), jade (brand), tomato /
// amber / grass (need), blue (confirmed facts) — light and dark steps.
// Front component CSS is injected into the host page unscoped: every class is
// prefixed with `er-`, resets use :where(), and layout reacts to the widget
// via @container (media queries would match the browser window).
export const APP_STYLES = `
.er-app {
  --er-bg: #f9f9f8;
  --er-surface: #ffffff;
  --er-surface-2: #f1f0ef;
  --er-surface-3: #e9e8e6;
  --er-border: #dad9d6;
  --er-border-soft: #e9e8e6;
  --er-text: #21201c;
  --er-muted: #63635e;
  --er-faint: #8d8d86;
  --er-accent: #208368;
  --er-accent-hover: #1a7058;
  --er-accent-text: #208368;
  --er-accent-soft: #e6f7ed;
  --er-accent-soft-2: #d6f1e3;
  --er-on-accent: #ffffff;
  --er-hero-from: #1d6b55;
  --er-hero-to: #29a383;
  --er-high: #d13415;
  --er-high-soft: #feebe7;
  --er-medium: #ab6400;
  --er-medium-soft: #fff7c2;
  --er-low: #2a7e3b;
  --er-low-soft: #e9f6e9;
  --er-unknown: #63635e;
  --er-unknown-soft: #f1f0ef;
  --er-confirmed: #0d74ce;
  --er-confirmed-soft: #e6f4fe;
  --er-focus: #0d74ce;
  --er-shadow-sm: 0 1px 2px rgba(33, 32, 28, 0.06);
  --er-shadow: 0 1px 2px rgba(33, 32, 28, 0.05), 0 8px 24px -12px rgba(33, 32, 28, 0.12);
  --er-radius: 18px;
  --er-radius-sm: 12px;
  container-type: inline-size;
  container-name: er;
  box-sizing: border-box;
  height: 100%;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  background: var(--er-bg);
  color: var(--er-text);
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "cv11", "ss01";
}
.er-app[data-theme="dark"] {
  --er-bg: #111110;
  --er-surface: #191918;
  --er-surface-2: #222221;
  --er-surface-3: #2a2a28;
  --er-border: #3b3a37;
  --er-border-soft: #2a2a28;
  --er-text: #eeeeec;
  --er-muted: #b5b3ad;
  --er-faint: #7c7b74;
  --er-accent: #29a383;
  --er-accent-hover: #27b08b;
  --er-accent-text: #1fd8a4;
  --er-accent-soft: #0f2e22;
  --er-accent-soft-2: #0b3b2c;
  --er-on-accent: #0d1512;
  --er-hero-from: #0b3b2c;
  --er-hero-to: #1b5745;
  --er-high: #ff977d;
  --er-high-soft: #391714;
  --er-medium: #ffca16;
  --er-medium-soft: #302008;
  --er-low: #71d083;
  --er-low-soft: #1b2a1e;
  --er-unknown: #b5b3ad;
  --er-unknown-soft: #222221;
  --er-confirmed: #70b8ff;
  --er-confirmed-soft: #0d2847;
  --er-focus: #70b8ff;
  --er-shadow-sm: none;
  --er-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04);
}
.er-app *, .er-app *::before, .er-app *::after { box-sizing: border-box; }
:where(.er-app) :where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(.er-app) :where(h1, h2, h3, h4, p, ul, ol, dl) { margin: 0; }
.er-app :focus-visible { outline: 3px solid var(--er-focus); outline-offset: 2px; }
.er-icon { display: inline-flex; flex: none; line-height: 0; }
/* Taps must land on the button, not on the SVG inside it. */
.er-app svg { pointer-events: none; }

/* ---------------------------------------------------------------- shell */
.er-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.er-header { padding: 18px 20px 0; }
.er-header-inner, .er-content, .er-nav-inner { max-width: 820px; margin: 0 auto; width: 100%; }
.er-header-inner { position: relative; }
.er-greeting { font-size: 24px; font-weight: 750; letter-spacing: -0.02em; }
.er-date { margin-top: 2px; color: var(--er-muted); font-size: 14px; }
.er-lang { position: absolute; top: 0; right: 0; display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--er-surface-2); }
.er-lang-option { min-height: 32px; min-width: 40px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--er-muted); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; }
.er-lang-option.er-lang-active { background: var(--er-surface); color: var(--er-text); box-shadow: var(--er-shadow-sm); }

.er-nav { padding: 12px 20px 10px; }
.er-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 4px; background: var(--er-surface-2); border-radius: 16px; }
.er-tab {
  min-height: 44px; border: 0; border-radius: 12px; background: transparent; color: var(--er-muted);
  font-weight: 600; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.er-tab:hover { color: var(--er-text); }
.er-tab.er-tab-active { background: var(--er-surface); color: var(--er-text); box-shadow: var(--er-shadow-sm); }
.er-tab-count { min-width: 20px; padding: 0 6px; border-radius: 999px; background: var(--er-accent); color: var(--er-on-accent); font-size: 12px; line-height: 20px; font-weight: 700; }

.er-main { padding: 8px 20px 32px; }

/* Phones: compact header, navigation at the bottom where the thumb is. */
@container er (max-width: 560px) {
  .er-header { padding: 12px 16px 4px; }
  .er-greeting { font-size: 20px; }
  .er-date { font-size: 13px; }
  .er-hero { padding: 18px; }
  .er-hero-title { font-size: 24px; }
  .er-nav { order: 3; padding: 6px 10px 10px; border-top: 1px solid var(--er-border-soft); background: var(--er-surface); }
  .er-tabs { background: transparent; padding: 0; }
  .er-tab { flex-direction: column; gap: 2px; min-height: 52px; font-size: 11px; position: relative; }
  .er-tab.er-tab-active { background: var(--er-accent-soft); color: var(--er-accent-text); box-shadow: none; }
  .er-tab-count { position: absolute; top: 4px; right: calc(50% - 24px); min-width: 18px; line-height: 18px; font-size: 11px; }
  .er-main { padding: 8px 14px 24px; }
}

.er-stack { display: flex; flex-direction: column; gap: 14px; }
.er-section-title {
  display: flex; align-items: center; gap: 8px; margin: 18px 0 10px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--er-muted);
}

/* ---------------------------------------------------------------- surfaces */
.er-card { background: var(--er-surface); border: 1px solid var(--er-border-soft); border-radius: var(--er-radius); padding: 16px; box-shadow: var(--er-shadow); }
.er-hero {
  position: relative; overflow: hidden; border: 0; padding: 22px; color: #ffffff;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(255, 255, 255, 0.18), transparent 55%),
    linear-gradient(135deg, var(--er-hero-from), var(--er-hero-to));
}
.er-hero-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; opacity: 0.9; }
.er-hero-title { margin: 8px 0 4px; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.er-hero-sub { margin: 0 0 18px; opacity: 0.92; }
.er-hero .er-btn-primary { position: relative; z-index: 1; background: #ffffff; color: #1d6b55; }
.er-hero .er-btn-primary:hover { background: #f1f0ef; }

.er-need-grid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
@container er (min-width: 700px) { .er-need-grid { grid-template-columns: 1fr 1fr; } }

.er-need-top { display: flex; align-items: center; gap: 12px; }
.er-need-text { flex: 1; min-width: 0; }
.er-row-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.er-name { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.er-headline { margin-top: 1px; font-weight: 600; font-size: 14px; }
.er-reason { margin-top: 8px; color: var(--er-muted); font-size: 14px; }
.er-percent { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.er-percent-label { display: block; margin-top: 4px; font-size: 11px; color: var(--er-muted); text-align: right; font-weight: 500; }

.er-tone-high { color: var(--er-high); }
.er-tone-medium { color: var(--er-medium); }
.er-tone-low { color: var(--er-low); }
.er-tone-unknown { color: var(--er-unknown); }
.er-tone-confirmed { color: var(--er-confirmed); }

/* avatar */
.er-avatar { flex: none; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--er-surface-2); color: var(--er-muted); }
.er-avatar[data-category="dairy"] { background: var(--er-confirmed-soft); color: var(--er-confirmed); }
.er-avatar[data-category="bakery"], .er-avatar[data-category="pantry"] { background: var(--er-medium-soft); color: var(--er-medium); }
.er-avatar[data-category="produce"] { background: var(--er-low-soft); color: var(--er-low); }
.er-avatar[data-category="beverages"] { background: var(--er-accent-soft); color: var(--er-accent-text); }
.er-avatar[data-category="frozen"] { background: var(--er-confirmed-soft); color: var(--er-confirmed); }
.er-avatar[data-category="household"], .er-avatar[data-category="personal_care"] { background: var(--er-high-soft); color: var(--er-high); }

/* gauge */
.er-gauge { position: relative; flex: none; display: inline-flex; align-items: center; justify-content: center; }
.er-gauge svg { position: absolute; inset: 0; }
.er-gauge-track { stroke: var(--er-surface-3); }
.er-gauge-value { stroke: var(--er-unknown); }
.er-gauge-value[data-tone="high"] { stroke: var(--er-high); }
.er-gauge-value[data-tone="medium"] { stroke: var(--er-medium); }
.er-gauge-value[data-tone="low"] { stroke: var(--er-low); }
.er-gauge-value[data-tone="confirmed"] { stroke: var(--er-confirmed); }
.er-gauge-text { position: relative; font-size: 15px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.er-gauge-text small { font-size: 10px; font-weight: 700; margin-left: 1px; }
.er-gauge-text[data-tone="high"] { color: var(--er-high); }
.er-gauge-text[data-tone="medium"] { color: var(--er-medium); }
.er-gauge-text[data-tone="low"] { color: var(--er-low); }
.er-gauge-text[data-tone="confirmed"] { color: var(--er-confirmed); }

/* bar meter (product details) */
.er-meter { height: 6px; margin-top: 12px; border-radius: 999px; background: var(--er-surface-3); overflow: hidden; }
.er-meter-fill { height: 100%; border-radius: 999px; background: var(--er-unknown); }
.er-meter-fill[data-tone="high"] { background: var(--er-high); }
.er-meter-fill[data-tone="medium"] { background: var(--er-medium); }
.er-meter-fill[data-tone="low"] { background: var(--er-low); }
.er-meter-fill[data-tone="confirmed"] { background: var(--er-confirmed); }
.er-meter-fill[data-estimate="true"] { background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.3) 0 6px, transparent 6px 12px); }

/* chips */
.er-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.er-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid transparent; white-space: nowrap; }
.er-chip-estimate { border: 1px dashed var(--er-faint); color: var(--er-muted); }
.er-chip-confirmed { background: var(--er-confirmed-soft); color: var(--er-confirmed); }
.er-chip-list { background: var(--er-accent-soft); color: var(--er-accent-text); }
.er-chip-muted { background: var(--er-surface-2); color: var(--er-muted); }

/* buttons */
.er-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.er-btn {
  min-height: 44px; padding: 0 16px; border-radius: var(--er-radius-sm); border: 1px solid var(--er-border);
  background: var(--er-surface); font-weight: 650; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.er-btn:hover { background: var(--er-surface-2); }
.er-btn:disabled { opacity: 0.5; cursor: progress; }
.er-btn-primary { background: var(--er-accent); border-color: transparent; color: var(--er-on-accent); }
.er-btn-primary:hover { background: var(--er-accent-hover); }
.er-btn-danger { color: var(--er-high); }
.er-btn-block { width: 100%; }
.er-btn-ghost { border-color: transparent; background: transparent; color: var(--er-muted); }
.er-btn-ghost:hover { background: var(--er-surface-2); color: var(--er-text); }
.er-btn-small { min-height: 38px; padding: 0 12px; font-size: 14px; }

/* why */
.er-why { margin-top: 12px; padding: 14px; border-radius: var(--er-radius-sm); background: var(--er-surface-2); font-size: 14px; }
.er-why ul { margin: 8px 0 0; padding-left: 18px; }
.er-why li + li { margin-top: 4px; }
.er-fine-print { margin-top: 8px; color: var(--er-muted); font-size: 13px; }

/* forms */
.er-form { display: flex; gap: 8px; }
.er-input { flex: 1; min-width: 0; min-height: 48px; padding: 0 14px; border-radius: var(--er-radius-sm); border: 1px solid var(--er-border); background: var(--er-surface); font-size: 16px; }
.er-input::placeholder { color: var(--er-faint); }
.er-input:focus { border-color: var(--er-accent); }
.er-label { display: block; font-size: 13px; font-weight: 600; color: var(--er-muted); margin-bottom: 4px; }

/* list items */
.er-item { display: flex; align-items: flex-start; gap: 12px; }
.er-item-body { flex: 1; min-width: 0; }
.er-check {
  flex: none; width: 44px; height: 44px; border-radius: 999px; border: 2px solid var(--er-accent);
  background: transparent; color: var(--er-accent-text); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}
.er-check:hover { background: var(--er-accent-soft); }
.er-qty { color: var(--er-muted); font-weight: 500; }

.er-buy { margin-top: 12px; padding: 14px; border-radius: var(--er-radius-sm); background: var(--er-surface-2); }
.er-buy-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@container er (min-width: 520px) { .er-buy-grid { grid-template-columns: auto 1fr 1fr; align-items: end; } }
.er-stepper { display: inline-flex; align-items: center; gap: 4px; }
.er-stepper-value { min-width: 48px; text-align: center; font-size: 18px; font-weight: 750; font-variant-numeric: tabular-nums; }

.er-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
@container er (min-width: 560px) { .er-facts { grid-template-columns: repeat(4, 1fr); } }
.er-fact { padding: 10px 12px; border-radius: var(--er-radius-sm); background: var(--er-surface-2); }
.er-fact dt { font-size: 12px; color: var(--er-muted); }
.er-fact dd { margin: 2px 0 0; font-weight: 700; }

.er-product-row { width: 100%; display: flex; align-items: center; gap: 12px; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.er-product-row .er-name { font-size: 16px; }
.er-product-meta { margin-top: 2px; color: var(--er-muted); font-size: 13px; }
.er-chevron { margin-left: auto; color: var(--er-faint); }
.er-dot { flex: none; width: 10px; height: 10px; border-radius: 999px; margin-top: 7px; background: var(--er-unknown); }
.er-dot[data-tone="high"] { background: var(--er-high); }
.er-dot[data-tone="medium"] { background: var(--er-medium); }
.er-dot[data-tone="low"] { background: var(--er-low); }
.er-dot[data-tone="confirmed"] { background: var(--er-confirmed); }

/* timeline */
.er-timeline { list-style: none; margin: 0; padding: 0; }
.er-timeline li { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--er-border-soft); }
.er-timeline li:last-child { border-bottom: 0; }
.er-time { color: var(--er-muted); font-size: 13px; }
.er-event-icon { flex: none; width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: var(--er-surface-2); color: var(--er-muted); }
.er-event-icon[data-tone="high"] { background: var(--er-high-soft); color: var(--er-high); }
.er-event-icon[data-tone="medium"] { background: var(--er-medium-soft); color: var(--er-medium); }
.er-event-icon[data-tone="low"] { background: var(--er-low-soft); color: var(--er-low); }
.er-event-icon[data-tone="confirmed"] { background: var(--er-confirmed-soft); color: var(--er-confirmed); }

/* empty, banner, loading */
.er-empty { text-align: center; padding: 32px 20px; }
.er-empty-icon { display: inline-flex; width: 56px; height: 56px; margin-bottom: 12px; border-radius: 18px; align-items: center; justify-content: center; background: var(--er-accent-soft); color: var(--er-accent-text); }
.er-empty h2 { margin: 0 0 6px; font-size: 20px; letter-spacing: -0.01em; }
.er-empty p { margin: 0 auto 16px; color: var(--er-muted); max-width: 440px; }
.er-empty .er-actions { justify-content: center; }
.er-banner { padding: 12px 14px; border-radius: var(--er-radius-sm); background: var(--er-high-soft); color: var(--er-high); font-weight: 600; }
.er-loading { padding: 40px 0; text-align: center; color: var(--er-muted); }
.er-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

/* prices and deals */
.er-price { margin-top: 8px; }
.er-verdict { margin: 12px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--er-surface); font-size: 14px; }
.er-verdict-great, .er-verdict-good { background: var(--er-low-soft); color: var(--er-low); }
.er-verdict-expensive { background: var(--er-high-soft); color: var(--er-high); }
.er-verdict-plan { display: block; margin-top: 4px; color: var(--er-text); }
.er-deal { border: 1px solid var(--er-accent-soft-2); background: linear-gradient(180deg, var(--er-accent-soft), var(--er-surface) 60%); }
.er-deal-price { text-align: right; flex: none; }
.er-deal-price strong { display: block; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--er-accent-text); font-variant-numeric: tabular-nums; }
.er-strike { color: var(--er-faint); text-decoration: line-through; font-size: 13px; }
.er-save { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: var(--er-accent); color: var(--er-on-accent); font-size: 12px; font-weight: 700; }

/* questions */
.er-question { border-left: 4px solid var(--er-confirmed); }

/* assistant */
.er-talk { padding: 16px; }
.er-talk-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.er-talk-badge { flex: none; display: inline-flex; width: 38px; height: 38px; border-radius: 12px; align-items: center; justify-content: center; background: var(--er-accent-soft); color: var(--er-accent-text); }
.er-talk-title { font-size: 16px; font-weight: 700; }
.er-talk-hint { color: var(--er-muted); font-size: 13px; }
.er-talk-bar { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 14px; border-radius: 999px; border: 1px solid var(--er-border); background: var(--er-surface-2); }
.er-talk-bar:focus-within { border-color: var(--er-accent); background: var(--er-surface); }
.er-talk-bar .er-icon { color: var(--er-faint); }
.er-talk-input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; font-size: 16px; outline: none; }
.er-talk-send { flex: none; width: 44px; height: 44px; border-radius: 999px; border: 0; background: var(--er-accent); color: var(--er-on-accent); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.er-talk-send:disabled { opacity: 0.4; cursor: default; }
.er-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.er-suggestion { min-height: 34px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--er-border); background: var(--er-surface); color: var(--er-text); font-size: 13px; font-weight: 600; cursor: pointer; }
.er-suggestion:hover { border-color: var(--er-accent); color: var(--er-accent-text); }
.er-talk-log { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.er-talk-said { margin: 0 0 4px auto; max-width: 85%; width: fit-content; padding: 9px 13px; border-radius: 16px 16px 4px 16px; background: var(--er-accent); color: var(--er-on-accent); }
.er-talk-reply { margin: 0 0 4px; max-width: 90%; width: fit-content; padding: 9px 13px; border-radius: 16px 16px 16px 4px; background: var(--er-surface-2); white-space: pre-line; }

@media (prefers-reduced-motion: no-preference) {
  .er-btn, .er-tab, .er-check, .er-suggestion, .er-talk-send { transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, transform 140ms ease; }
  .er-btn:active, .er-check:active, .er-talk-send:active, .er-suggestion:active { transform: scale(0.97); }
  .er-gauge-value { transition: stroke-dasharray 400ms ease; }
}
`;
