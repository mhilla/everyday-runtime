import { useState } from 'react';
import type { FormEvent } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import type { ProductPrices } from 'src/domain/deals';
import { formatMoney, judgePrice, planStockUp } from 'src/domain/prices';
import type { ProductOverview } from 'src/domain/shopping';
import { formatAgo } from 'src/domain/time';
import type { Household } from 'src/ui/use-household';

type CommunityPrice = {
  price: number;
  currency: string;
  date: string;
  isDiscounted: boolean;
  store: string | null;
  packQuantity: number | null;
};

type CommunityResult = {
  error?: string;
  product: { name: string | null; brand: string | null } | null;
  prices: CommunityPrice[];
};

const toNumber = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);

  return normalized !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const SOURCE_LABELS: Record<string, string> = {
  PURCHASE: 'bought',
  MANUAL: 'seen',
  RECEIPT: 'receipt',
  OPEN_PRICES: 'community',
};

const VERDICT_LABELS: Record<string, string> = {
  GREAT: 'Great price',
  GOOD: 'Good price',
  NORMAL: 'Usual price',
  EXPENSIVE: 'Expensive',
  UNKNOWN: 'Not enough data',
};

export const PriceSection = ({
  entry,
  prices,
  household,
}: {
  entry: ProductOverview;
  prices: ProductPrices | undefined;
  household: Household;
}) => {
  const { product, assessment } = entry;
  const { run, busyKey, now } = household;
  const unit = product.defaultUnit;
  const per = unit ? `/${unit}` : '';
  const idPrefix = `er-price-${product.id}`;
  const [price, setPrice] = useState('');
  const [pack, setPack] = useState(String(product.typicalPurchaseQuantity ?? 1));
  const [store, setStore] = useState('');
  const [alert, setAlert] = useState(product.priceAlertUnitPrice?.toString() ?? '');
  const [shelfLife, setShelfLife] = useState(product.shelfLifeDays?.toString() ?? '');
  const [barcode, setBarcode] = useState(product.barcode ?? '');
  const [community, setCommunity] = useState<CommunityResult | null>(null);
  const [communityState, setCommunityState] = useState<'idle' | 'loading' | 'error'>('idle');

  const summary = prices?.summary;
  const priceValue = toNumber(price);
  const packValue = toNumber(pack);
  const preview =
    summary && priceValue !== null && packValue !== null && packValue > 0
      ? judgePrice(priceValue / packValue, summary, unit)
      : null;
  const previewPlan =
    preview && priceValue !== null && packValue
      ? planStockUp({
          ratePerDay: assessment.consumptionRatePerDay,
          usualDurationDays: assessment.expectedDurationDays,
          packSize: packValue,
          shelfLifeDays: product.shelfLifeDays,
          judgement: preview,
          unitPrice: priceValue / packValue,
          typicalUnitPrice: summary?.typicalUnitPrice ?? null,
          unit,
          currency: summary?.currency ?? 'EUR',
        })
      : null;
  const recent = [...(prices?.points ?? [])]
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, 5);

  const logPrice = (event: FormEvent) => {
    event.preventDefault();
    if (priceValue === null || packValue === null) {
      return;
    }
    run(
      product.id,
      (actions) =>
        actions.logPrice(product, {
          priceAmount: priceValue,
          packQuantity: packValue,
          store: store.trim() === '' ? null : store.trim(),
        }),
      'Price saved',
    );
    setPrice('');
  };

  const saveSettings = (event: FormEvent) => {
    event.preventDefault();
    run(
      product.id,
      (actions) =>
        actions.updateProductSettings(product, {
          priceAlertUnitPrice: toNumber(alert),
          shelfLifeDays: toNumber(shelfLife) === null ? null : Math.round(toNumber(shelfLife) as number),
          barcode: barcode.trim() === '' ? null : barcode.trim(),
        }),
      'Settings saved',
    );
  };

  const loadCommunity = async () => {
    setCommunityState('loading');
    try {
      const result = await new RestApiClient().get<CommunityResult>('/s/community-prices', {
        query: { barcode: barcode.trim(), unit },
      });

      setCommunity(result);
      setCommunityState(result.error ? 'error' : 'idle');
    } catch {
      setCommunity(null);
      setCommunityState('error');
    }
  };

  return (
    <section className="er-price" aria-labelledby={`${idPrefix}-title`}>
      <h3 className="er-section-title" id={`${idPrefix}-title`}>
        Prices
      </h3>
      {summary && summary.typicalUnitPrice !== null ? (
        <dl className="er-facts">
          <div className="er-fact">
            <dt>Usual</dt>
            <dd>{formatMoney(summary.typicalUnitPrice, summary.currency)}{per}</dd>
          </div>
          <div className="er-fact">
            <dt>Lowest (90 days)</dt>
            <dd>
              {summary.lowestRecent
                ? `${formatMoney(summary.lowestRecent.unitPrice, summary.currency)}${per}`
                : '—'}
            </dd>
          </div>
          <div className="er-fact">
            <dt>Where</dt>
            <dd>{summary.lowestRecent?.store ?? '—'}</dd>
          </div>
          <div className="er-fact">
            <dt>Prices known</dt>
            <dd>{summary.pointCount}</dd>
          </div>
        </dl>
      ) : (
        <p className="er-reason">
          No prices yet. Add a price when you buy it or see it — after two prices the app can
          tell you whether something is a good deal.
        </p>
      )}

      {recent.length > 0 && (
        <ul className="er-timeline">
          {recent.map((point) => (
            <li key={`${point.source}-${point.observedAt.getTime()}-${point.unitPrice}`}>
              <div>
                <strong>
                  {formatMoney(point.unitPrice, point.currency)}
                  {per}
                </strong>{' '}
                · {SOURCE_LABELS[point.source] ?? point.source}
                <div className="er-time">
                  {formatAgo(point.observedAt, now)}
                  {point.store ? ` · ${point.store}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="er-buy" onSubmit={logPrice} aria-label={`Log a price for ${product.name}`}>
        <div className="er-buy-grid">
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-amount`}>
              Price seen (€)
            </label>
            <input id={`${idPrefix}-amount`} className="er-input" inputMode="decimal" placeholder="e.g. 2.99" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-pack`}>
              For how much{unit ? ` (${unit})` : ''}
            </label>
            <input id={`${idPrefix}-pack`} className="er-input" inputMode="decimal" value={pack} onChange={(e) => setPack(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-store`}>
              Where (optional)
            </label>
            <input id={`${idPrefix}-store`} className="er-input" placeholder="e.g. Discounter" value={store} onChange={(e) => setStore(e.target.value)} />
          </div>
        </div>
        {preview && (
          <p className={`er-verdict er-verdict-${preview.verdict.toLowerCase()}`} aria-live="polite">
            <strong>{VERDICT_LABELS[preview.verdict]}.</strong> {preview.reason}
            {previewPlan && <span className="er-verdict-plan"> {previewPlan.reason}</span>}
          </p>
        )}
        <div className="er-actions">
          <button type="submit" className="er-btn er-btn-small" disabled={busyKey !== null || priceValue === null || packValue === null || packValue === 0}>
            Save price
          </button>
        </div>
      </form>

      <form className="er-buy" onSubmit={saveSettings} aria-label={`Price alert and details for ${product.name}`}>
        <div className="er-buy-grid">
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-alert`}>
              Alert me below (€{per})
            </label>
            <input id={`${idPrefix}-alert`} className="er-input" inputMode="decimal" placeholder="e.g. 0.45" value={alert} onChange={(e) => setAlert(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-shelf`}>
              Keeps for (days)
            </label>
            <input id={`${idPrefix}-shelf`} className="er-input" inputMode="numeric" placeholder="e.g. 365" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-barcode`}>
              Barcode (EAN)
            </label>
            <input id={`${idPrefix}-barcode`} className="er-input" inputMode="numeric" placeholder="e.g. 3057640257773" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>
        </div>
        <div className="er-actions">
          <button type="submit" className="er-btn er-btn-small" disabled={busyKey !== null}>
            Save
          </button>
          <button
            type="button"
            className="er-btn er-btn-ghost er-btn-small"
            disabled={!/^\d{8,14}$/.test(barcode.trim()) || communityState === 'loading'}
            onClick={loadCommunity}
          >
            {communityState === 'loading' ? 'Looking up…' : 'Community prices'}
          </button>
        </div>
      </form>

      {communityState === 'error' && (
        <p className="er-reason" role="status">
          Could not load community prices{community?.error ? `: ${community.error}` : ''}.
        </p>
      )}
      {community && !community.error && (
        <div className="er-why" role="status">
          <p>
            <strong>Open Prices</strong>
            {community.product?.brand || community.product?.name
              ? ` · ${[community.product?.brand, community.product?.name].filter(Boolean).join(' ')}`
              : ''}{' '}
            — {community.prices.length === 0 ? 'no community prices yet for this barcode.' : `${community.prices.length} recent prices from other people.`}
          </p>
          {community.prices.length > 0 && (
            <>
              <ul>
                {community.prices.slice(0, 5).map((p, index) => (
                  <li key={`${p.date}-${index}`}>
                    {formatMoney(p.price, p.currency)}
                    {p.packQuantity ? ` for ${p.packQuantity}${unit ? ` ${unit}` : ''}` : ''} · {p.date}
                    {p.store ? ` · ${p.store}` : ''}
                    {p.isDiscounted ? ' · discounted' : ''}
                  </li>
                ))}
              </ul>
              <div className="er-actions">
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(product.id, (actions) => actions.importCommunityPrices(product, community.prices), 'Community prices added')
                  }
                >
                  Use these prices
                </button>
              </div>
            </>
          )}
          <p className="er-fine-print">Community data from Open Prices (Open Food Facts, ODbL). Prices may be from other countries.</p>
        </div>
      )}
    </section>
  );
};
