import { useState } from 'react';
import type { FormEvent } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import type { ProductPrices } from 'src/domain/deals';
import { judgePrice, planStockUp } from 'src/domain/prices';
import type { ProductOverview } from 'src/domain/shopping';
import { agoText, moneyText } from 'src/domain/messages';
import { renderMessage } from 'src/domain/messages';
import { useI18n } from 'src/ui/i18n';
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
  GREAT: 'Steal',
  GOOD: 'Good deal',
  NORMAL: 'Regular price',
  EXPENSIVE: 'Pricey',
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
  const { t, lang } = useI18n();
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
      t('Price saved'),
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
      t('Settings saved'),
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
        {t('Prices')}
      </h3>
      {summary && summary.typicalUnitPrice !== null ? (
        <dl className="er-facts">
          <div className="er-fact">
            <dt>{t('Usual')}</dt>
            <dd>{moneyText(summary.typicalUnitPrice, summary.currency, lang)}{per}</dd>
          </div>
          <div className="er-fact">
            <dt>{t('Lowest (90 days)')}</dt>
            <dd>
              {summary.lowestRecent
                ? `${moneyText(summary.lowestRecent.unitPrice, summary.currency, lang)}${per}`
                : '—'}
            </dd>
          </div>
          <div className="er-fact">
            <dt>{t('Where')}</dt>
            <dd>{summary.lowestRecent?.store ?? '—'}</dd>
          </div>
          <div className="er-fact">
            <dt>{t('Prices known')}</dt>
            <dd>{summary.pointCount}</dd>
          </div>
        </dl>
      ) : (
        <p className="er-reason">
          {t('No prices yet. Log one when you buy or spot it — after two, we\'ll tell you whether it\'s a deal.')}
        </p>
      )}

      {recent.length > 0 && (
        <ul className="er-timeline">
          {recent.map((point) => (
            <li key={`${point.source}-${point.observedAt.getTime()}-${point.unitPrice}`}>
              <div>
                <strong>
                  {moneyText(point.unitPrice, point.currency, lang)}
                  {per}
                </strong>{' '}
                · {t(SOURCE_LABELS[point.source] ?? point.source)}
                <div className="er-time">
                  {agoText(point.observedAt, now, lang)}
                  {point.store ? ` · ${point.store}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="er-buy" onSubmit={logPrice} aria-label={t('Log a price for {name}', { name: product.name })}>
        <div className="er-buy-grid">
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-amount`}>
              {t('Price seen (€)')}
            </label>
            <input id={`${idPrefix}-amount`} className="er-input" inputMode="decimal" placeholder={t('e.g. 2.99')} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-pack`}>
              {t('For how much{unit}', { unit: unit ? ` (${unit})` : '' })}
            </label>
            <input id={`${idPrefix}-pack`} className="er-input" inputMode="decimal" value={pack} onChange={(e) => setPack(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-store`}>
              {t('Where (optional)')}
            </label>
            <input id={`${idPrefix}-store`} className="er-input" placeholder={t('e.g. Discounter')} value={store} onChange={(e) => setStore(e.target.value)} />
          </div>
        </div>
        {preview && (
          <p className={`er-verdict er-verdict-${preview.verdict.toLowerCase()}`} aria-live="polite">
            <strong>{t(VERDICT_LABELS[preview.verdict])}.</strong> {renderMessage(preview.reasonMessage, lang)}
            {previewPlan && <span className="er-verdict-plan"> {renderMessage(previewPlan.reasonMessage, lang)}</span>}
          </p>
        )}
        <div className="er-actions">
          <button type="submit" className="er-btn er-btn-small" disabled={busyKey !== null || priceValue === null || packValue === null || packValue === 0}>
            {t('Save price')}
          </button>
        </div>
      </form>

      <form className="er-buy" onSubmit={saveSettings} aria-label={t('Price alert and details for {name}', { name: product.name })}>
        <div className="er-buy-grid">
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-alert`}>
              {t('Alert me below (€{per})', { per })}
            </label>
            <input id={`${idPrefix}-alert`} className="er-input" inputMode="decimal" placeholder={t('e.g. 0.45')} value={alert} onChange={(e) => setAlert(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-shelf`}>
              {t('Keeps for (days)')}
            </label>
            <input id={`${idPrefix}-shelf`} className="er-input" inputMode="numeric" placeholder={t('e.g. 365')} value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
          </div>
          <div>
            <label className="er-label" htmlFor={`${idPrefix}-barcode`}>
              {t('Barcode (EAN)')}
            </label>
            <input id={`${idPrefix}-barcode`} className="er-input" inputMode="numeric" placeholder={t('e.g. 3057640257773')} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>
        </div>
        <div className="er-actions">
          <button type="submit" className="er-btn er-btn-small" disabled={busyKey !== null}>
            {t('Save')}
          </button>
          <button
            type="button"
            className="er-btn er-btn-ghost er-btn-small"
            disabled={!/^\d{8,14}$/.test(barcode.trim()) || communityState === 'loading'}
            onClick={loadCommunity}
          >
            {communityState === 'loading' ? t('Looking up…') : t('Community prices')}
          </button>
        </div>
      </form>

      {communityState === 'error' && (
        <p className="er-reason" role="status">
          {t('Could not load community prices{error}.', { error: community?.error ? `: ${community.error}` : '' })}
        </p>
      )}
      {community && !community.error && (
        <div className="er-why" role="status">
          <p>
            <strong>Open Prices</strong>
            {community.product?.brand || community.product?.name
              ? ` · ${[community.product?.brand, community.product?.name].filter(Boolean).join(' ')}`
              : ''}{' '}
            — {community.prices.length === 0 ? t('no community prices yet for this barcode.') : t('{count} recent prices from other people.', { count: community.prices.length })}
          </p>
          {community.prices.length > 0 && (
            <>
              <ul>
                {community.prices.slice(0, 5).map((p, index) => (
                  <li key={`${p.date}-${index}`}>
                    {moneyText(p.price, p.currency, lang)}
                    {p.packQuantity ? t(' for {amount}', { amount: `${p.packQuantity}${unit ? ` ${unit}` : ''}` }) : ''} · {p.date}
                    {p.store ? ` · ${p.store}` : ''}
                    {p.isDiscounted ? t(' · discounted') : ''}
                  </li>
                ))}
              </ul>
              <div className="er-actions">
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(product.id, (actions) => actions.importCommunityPrices(product, community.prices), t('Community prices added'))
                  }
                >
                  {t('Use these prices')}
                </button>
              </div>
            </>
          )}
          <p className="er-fine-print">{t('Community data from Open Prices (Open Food Facts, ODbL). Prices may be from other countries.')}</p>
        </div>
      )}
    </section>
  );
};
