// One stylesheet for the whole app. Front component CSS is injected into the
// host page unscoped, so every class is prefixed with `er-` and nothing
// targets bare elements. Layout reacts to the widget size via @container
// (media queries would match the browser window, not the widget).
export const APP_STYLES = `
.er-app {
  --er-bg: #f6f4ee;
  --er-surface: #ffffff;
  --er-surface-2: #efece4;
  --er-text: #1c1f1a;
  --er-muted: #62675f;
  --er-border: #e2ddd1;
  --er-accent: #2d6a4f;
  --er-accent-hover: #245a42;
  --er-accent-soft: #e3efe8;
  --er-on-accent: #ffffff;
  --er-high: #b9401a;
  --er-high-soft: #fbe9e2;
  --er-medium: #9a6700;
  --er-medium-soft: #fbf1dc;
  --er-low: #3f7a55;
  --er-low-soft: #e6f2ea;
  --er-unknown: #6f746b;
  --er-unknown-soft: #eceae4;
  --er-confirmed: #1d5fa8;
  --er-confirmed-soft: #e4eefa;
  --er-focus: #1d5fa8;
  --er-shadow: 0 1px 2px rgba(28, 31, 26, 0.06), 0 4px 16px rgba(28, 31, 26, 0.05);
  container-type: inline-size;
  container-name: er;
  box-sizing: border-box;
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  background: var(--er-bg);
  color: var(--er-text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.er-app[data-theme="dark"] {
  --er-bg: #121411;
  --er-surface: #1b1e1a;
  --er-surface-2: #232721;
  --er-text: #eceee8;
  --er-muted: #a3a89f;
  --er-border: #30352e;
  --er-accent: #74c69d;
  --er-accent-hover: #8fd4b0;
  --er-accent-soft: #1f3a2c;
  --er-on-accent: #0d1f16;
  --er-high: #ff8a65;
  --er-high-soft: #3a2119;
  --er-medium: #f2c14e;
  --er-medium-soft: #372d15;
  --er-low: #86c79c;
  --er-low-soft: #1d3325;
  --er-unknown: #a3a89f;
  --er-unknown-soft: #262a24;
  --er-confirmed: #7fb2f0;
  --er-confirmed-soft: #1b2b40;
  --er-focus: #7fb2f0;
  --er-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
.er-app *, .er-app *::before, .er-app *::after { box-sizing: border-box; }
:where(.er-app) :where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(.er-app) :where(h1, h2, h3, h4, p, ul, dl) { margin: 0; }
.er-app :focus-visible { outline: 3px solid var(--er-focus); outline-offset: 2px; }

.er-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.er-header-inner { position: relative; }
.er-lang { position: absolute; top: 0; right: 0; display: inline-flex; gap: 2px; padding: 2px; border-radius: 999px; background: var(--er-surface-2); }
.er-lang-option { min-height: 32px; min-width: 40px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--er-muted); font-size: 13px; font-weight: 700; cursor: pointer; }
.er-lang-option.er-lang-active { background: var(--er-surface); color: var(--er-text); box-shadow: var(--er-shadow); }
.er-header { padding: 16px 16px 0; }
@container er (max-width: 480px) {
  .er-header { padding-top: 10px; }
  .er-greeting { font-size: 18px; }
  .er-date { font-size: 13px; }
}
.er-nav {
  padding: 10px 16px 8px;
  background: var(--er-bg);
}
.er-header-inner, .er-content, .er-nav-inner { max-width: 760px; margin: 0 auto; width: 100%; }
.er-greeting { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.er-date { margin: 2px 0 0; color: var(--er-muted); font-size: 14px; }

.er-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px;
  background: var(--er-surface-2);
  border-radius: 14px;
}
.er-tab {
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--er-muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.er-tab.er-tab-active { background: var(--er-surface); color: var(--er-text); box-shadow: var(--er-shadow); }
.er-tab-count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--er-accent);
  color: var(--er-on-accent);
  font-size: 12px;
  line-height: 20px;
}

.er-main { padding: 8px 16px 32px; }
.er-stack { display: flex; flex-direction: column; gap: 12px; }
.er-section-title {
  margin: 20px 0 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--er-muted);
}

.er-card {
  background: var(--er-surface);
  border: 1px solid var(--er-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--er-shadow);
}
.er-hero { background: var(--er-accent); color: var(--er-on-accent); border: 0; padding: 20px; }
.er-hero-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; opacity: 0.85; }
.er-hero-title { margin: 4px 0 2px; font-size: 26px; font-weight: 750; letter-spacing: -0.02em; line-height: 1.15; }
.er-hero-sub { margin: 0 0 16px; opacity: 0.9; }
.er-hero .er-btn-primary { background: var(--er-on-accent); color: var(--er-accent); }
.er-hero .er-btn-primary:hover { opacity: 0.92; background: var(--er-on-accent); }

.er-need-grid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
@container er (min-width: 700px) {
  .er-need-grid { grid-template-columns: 1fr 1fr; }
}

.er-row-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.er-name { margin: 0; font-size: 17px; font-weight: 700; }
.er-headline { margin: 2px 0 0; font-weight: 600; }
.er-reason { margin: 4px 0 0; color: var(--er-muted); font-size: 14px; }
.er-percent { font-size: 26px; font-weight: 750; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.er-percent-label { display: block; margin-top: 4px; font-size: 11px; color: var(--er-muted); text-align: right; }

.er-tone-high { color: var(--er-high); }
.er-tone-medium { color: var(--er-medium); }
.er-tone-low { color: var(--er-low); }
.er-tone-unknown { color: var(--er-unknown); }
.er-tone-confirmed { color: var(--er-confirmed); }

.er-meter { height: 6px; margin-top: 12px; border-radius: 999px; background: var(--er-surface-2); overflow: hidden; }
.er-meter-fill { height: 100%; border-radius: 999px; }
.er-meter-fill[data-tone="high"] { background: var(--er-high); }
.er-meter-fill[data-tone="medium"] { background: var(--er-medium); }
.er-meter-fill[data-tone="low"] { background: var(--er-low); }
.er-meter-fill[data-tone="unknown"] { background: var(--er-unknown); }
.er-meter-fill[data-tone="confirmed"] { background: var(--er-confirmed); }
.er-meter-fill[data-estimate="true"] {
  background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.28) 0 6px, transparent 6px 12px);
}

.er-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.er-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}
.er-chip-estimate { border: 1px dashed var(--er-muted); color: var(--er-muted); }
.er-chip-confirmed { background: var(--er-confirmed-soft); color: var(--er-confirmed); }
.er-chip-list { background: var(--er-accent-soft); color: var(--er-accent); }
.er-chip-muted { background: var(--er-surface-2); color: var(--er-muted); }

.er-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.er-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--er-border);
  background: var(--er-surface);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.er-btn:hover { background: var(--er-surface-2); }
.er-btn:disabled { opacity: 0.55; cursor: progress; }
.er-btn-primary { background: var(--er-accent); border-color: transparent; color: var(--er-on-accent); }
.er-btn-primary:hover { background: var(--er-accent-hover); }
.er-btn-danger { color: var(--er-high); }
.er-btn-block { width: 100%; }
.er-btn-ghost { border-color: transparent; background: transparent; color: var(--er-muted); }
.er-btn-ghost:hover { background: var(--er-surface-2); color: var(--er-text); }
.er-btn-small { min-height: 36px; padding: 0 12px; font-size: 14px; }

.er-price { margin-top: 8px; }
.er-verdict { margin: 12px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--er-surface); font-size: 14px; }
.er-verdict-great, .er-verdict-good { background: var(--er-low-soft); color: var(--er-low); }
.er-verdict-expensive { background: var(--er-high-soft); color: var(--er-high); }
.er-verdict-plan { display: block; margin-top: 4px; color: var(--er-text); }
.er-deal { border-left: 4px solid var(--er-low); }
.er-question { border-left: 4px solid var(--er-confirmed); }
.er-why { margin-top: 12px; padding: 12px; border-radius: 12px; background: var(--er-surface-2); font-size: 14px; }
.er-why ul { margin: 6px 0 0; padding-left: 18px; }
.er-why li + li { margin-top: 4px; }
.er-why p { margin: 0; }
.er-fine-print { margin: 8px 0 0; color: var(--er-muted); font-size: 13px; }

.er-form { display: flex; gap: 8px; }
.er-input {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--er-border);
  background: var(--er-surface);
  font-size: 16px;
}
.er-input::placeholder { color: var(--er-muted); }
.er-label { display: block; font-size: 13px; font-weight: 600; color: var(--er-muted); margin-bottom: 4px; }

.er-item { display: flex; align-items: flex-start; gap: 12px; }
.er-item-body { flex: 1; min-width: 0; }
.er-check {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 2px solid var(--er-accent);
  background: transparent;
  color: var(--er-accent);
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}
.er-check:hover { background: var(--er-accent-soft); }
.er-qty { color: var(--er-muted); font-weight: 500; }

.er-buy { margin-top: 12px; padding: 12px; border-radius: 12px; background: var(--er-surface-2); }
.er-buy-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@container er (min-width: 520px) {
  .er-buy-grid { grid-template-columns: auto 1fr 1fr; align-items: end; }
}
.er-stepper { display: inline-flex; align-items: center; gap: 4px; }
.er-stepper-value { min-width: 48px; text-align: center; font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }

.er-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
@container er (min-width: 560px) { .er-facts { grid-template-columns: repeat(4, 1fr); } }
.er-fact { padding: 10px; border-radius: 12px; background: var(--er-surface-2); }
.er-fact dt { font-size: 12px; color: var(--er-muted); }
.er-fact dd { margin: 2px 0 0; font-weight: 700; }

.er-product-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.er-product-row .er-name { font-size: 16px; }
.er-product-meta { margin: 2px 0 0; color: var(--er-muted); font-size: 13px; }
.er-chevron { margin-left: auto; color: var(--er-muted); font-size: 18px; }
.er-dot { flex: none; width: 10px; height: 10px; border-radius: 999px; margin-top: 7px; }
.er-dot[data-tone="high"] { background: var(--er-high); }
.er-dot[data-tone="medium"] { background: var(--er-medium); }
.er-dot[data-tone="low"] { background: var(--er-low); }
.er-dot[data-tone="unknown"] { background: var(--er-unknown); }
.er-dot[data-tone="confirmed"] { background: var(--er-confirmed); }

.er-timeline { list-style: none; margin: 0; padding: 0; }
.er-timeline li { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--er-border); }
.er-timeline li:last-child { border-bottom: 0; }
.er-time { color: var(--er-muted); font-size: 13px; }

.er-empty { text-align: center; padding: 28px 20px; }
.er-empty h2 { margin: 0 0 6px; font-size: 19px; }
.er-empty p { margin: 0 auto 16px; color: var(--er-muted); max-width: 420px; }
.er-empty .er-actions { justify-content: center; }

.er-banner { padding: 12px 14px; border-radius: 12px; background: var(--er-high-soft); color: var(--er-high); font-weight: 600; }
.er-loading { padding: 40px 0; text-align: center; color: var(--er-muted); }
.er-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .er-btn, .er-tab, .er-check { transition: background-color 120ms ease, opacity 120ms ease; }
}
`;
