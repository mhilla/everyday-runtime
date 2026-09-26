import {
  IconAlertTriangle,
  IconArchive,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconPlus,
  IconShoppingBag,
} from '@tabler/icons-react';
import { useState } from 'react';

import {
  categoryLabel,
  describeConfidence,
  describeNeed,
  formatRate,
  observationLabel,
} from 'src/domain/presentation';
import { sortProductsForBrowsing } from 'src/domain/shopping';
import type { ProductOverview } from 'src/domain/shopping';
import { agoText, intervalText, renderMessage } from 'src/domain/messages';
import { ariaBool, BuyPanel, EmptyState, EvidenceChip, NeedMeter, QuickAddForm, WhyPanel } from 'src/ui/components';
import { PriceSection } from 'src/ui/price-section';
import { WelcomeState } from 'src/ui/screens/now-screen';
import { NeedGauge, ProductAvatar } from 'src/ui/design';
import { useI18n } from 'src/ui/i18n';
import type { Household } from 'src/ui/use-household';

const ProductDetail = ({
  entry,
  household,
}: {
  entry: ProductOverview;
  household: Household;
}) => {
  const [isBuying, setIsBuying] = useState(false);
  const { t, lang } = useI18n();
  const { run, busyKey, snapshot, now } = household;
  const { product, assessment } = entry;
  const busy = busyKey !== null;
  const history = (snapshot?.observations ?? [])
    .filter((observation) => observation.productId === product.id)
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, 5);

  return (
    <div id={`er-product-${product.id}`}>
      <p className="er-reason">{renderMessage(assessment.reasonMessage, lang)}</p>
      <NeedMeter assessment={assessment} />
      <div className="er-chips">
        <EvidenceChip overview={entry} />
        {assessment.calibrationFactor !== null && (
          <span className="er-chip er-chip-muted" title={t('Adjusted using your earlier Empty / Still have it reports')}>
            {t('Learns from your corrections')}
          </span>
        )}
      </div>
      <dl className="er-facts">
        <div className="er-fact">
          <dt>{t('Last bought')}</dt>
          <dd>{assessment.lastPurchasedAt ? agoText(assessment.lastPurchasedAt, now, lang) : '—'}</dd>
        </div>
        <div className="er-fact">
          <dt>{t('Lasts about')}</dt>
          <dd>{assessment.expectedDurationDays ? intervalText(assessment.expectedDurationDays, lang) : t('not yet known')}</dd>
        </div>
        {assessment.consumptionRatePerDay !== null ? (
          <div className="er-fact">
            <dt>{t('Use per day')}</dt>
            <dd>{formatRate(assessment.consumptionRatePerDay, product.defaultUnit)}</dd>
          </div>
        ) : (
          <div className="er-fact">
            <dt>{t('Purchases')}</dt>
            <dd>{assessment.purchaseCount}</dd>
          </div>
        )}
        <div className="er-fact">
          <dt>{t('Confidence')}</dt>
          <dd>{describeConfidence(assessment.confidence, lang)}</dd>
        </div>
      </dl>
      <div className="er-actions">
        <button
          type="button"
          className="er-btn er-btn-small"
          disabled={busy}
          onClick={() => run(product.id, (actions) => actions.markEmpty(entry), t('{name} is out — added to your list', { name: product.name }))}
        >
          <IconAlertTriangle size={18} stroke={2} aria-hidden="true" />
          {t('All out')}
        </button>
        <button
          type="button"
          className="er-btn er-btn-small"
          disabled={busy}
          onClick={() => run(product.id, (actions) => actions.markInStock(entry), t('Got it — {name} is still stocked', { name: product.name }))}
        >
          <IconCircleCheck size={18} stroke={2} aria-hidden="true" />
          {t('Still have some')}
        </button>
        <button
          type="button"
          className="er-btn er-btn-small"
          aria-expanded={ariaBool(isBuying)}
          onClick={() => setIsBuying((value) => !value)}
        >
          <IconShoppingBag size={18} stroke={2} aria-hidden="true" />
          {t('Bought it')}
        </button>
        {entry.openItem === null && (
          <button
            type="button"
            className="er-btn er-btn-primary er-btn-small"
            disabled={busy}
            onClick={() => run(product.id, (actions) => actions.addManually(entry), t('{name} added to your list', { name: product.name }))}
          >
            <IconPlus size={18} stroke={2} aria-hidden="true" />
            {t('Add to list')}
          </button>
        )}
      </div>
      {isBuying && (
        <BuyPanel
          product={product}
          initialQuantity={entry.openItem?.requestedQuantity ?? product.typicalPurchaseQuantity ?? 1}
          busy={busyKey === product.id}
          onCancel={() => setIsBuying(false)}
          onConfirm={(details) =>
            run(product.id, (actions) => actions.markPurchased(entry.openItem, product, details), t('Nice — {name} is checked off', { name: product.name }))
          }
        />
      )}
      <WhyPanel assessment={assessment} id={`er-product-why-${product.id}`} />
      <PriceSection entry={entry} prices={household.prices.get(product.id)} household={household} />
      {history.length > 0 && (
        <>
          <h3 className="er-section-title">{t('Recent activity')}</h3>
          <ul className="er-timeline">
            {history.map((observation) => (
              <li key={observation.id}>
                <div>
                  <strong>{observationLabel(observation.type, lang)}</strong>
                  {observation.quantity !== null && ` · ${observation.quantity}`}
                  <div className="er-time">
                    {agoText(observation.observedAt, now, lang)}
                    {observation.note ? ` · ${observation.note}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="er-actions">
        <button
          type="button"
          className="er-btn er-btn-ghost er-btn-small er-btn-danger"
          disabled={busy}
          onClick={() => run(product.id, (actions) => actions.archiveProduct(entry), t('{name} is no longer tracked', { name: product.name }))}
        >
          <IconArchive size={18} stroke={2} aria-hidden="true" />
          {t('Stop tracking')}
        </button>
      </div>
    </div>
  );
};

export const ProductsScreen = ({ household }: { household: Household }) => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { overview, busyKey, run, snapshot } = household;
  const { t, lang } = useI18n();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = sortProductsForBrowsing(overview).filter((entry) =>
    entry.product.name.toLocaleLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="er-stack">
      <h2 className="er-visually-hidden">{t('Pantry')}</h2>
      <QuickAddForm
        label={t('Find or add a product')}
        placeholder={t('Search or add a product…')}
        submitLabel={t('Add')}
        busy={busyKey !== null}
        value={query}
        onChange={setQuery}
        onSubmit={(value) =>
          run('new-product', (actions) => actions.createProduct(value, snapshot?.products ?? []), t('Added to your pantry'))
        }
      />

      {overview.length === 0 ? (
        <WelcomeState household={household} />
      ) : visible.length === 0 ? (
        <EmptyState title={t('Not in your pantry yet')}>
          {t('Hit “Add” to start tracking “{name}”.', { name: query.trim() })}
        </EmptyState>
      ) : (
        <ul className="er-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visible.map((entry) => {
            const headline = describeNeed(entry.assessment, lang);
            const isExpanded = expandedId === entry.product.id;

            return (
              <li key={entry.product.id} className="er-card" aria-busy={ariaBool(busyKey === entry.product.id)}>
                <button
                  type="button"
                  className="er-product-row"
                  aria-expanded={ariaBool(isExpanded)}
                  aria-controls={`er-product-${entry.product.id}`}
                  onClick={() => setExpandedId(isExpanded ? null : entry.product.id)}
                >
                  <ProductAvatar category={entry.product.category} size={40} />
                  <span>
                    <span className="er-name">{entry.product.name}</span>
                    <span className="er-product-meta" style={{ display: 'block' }}>
                      {headline.label}
                      {entry.product.category && ` · ${categoryLabel(entry.product.category, lang)}`}
                      {entry.openItem && t(' · on your list')}
                    </span>
                  </span>
                  <NeedGauge
                    value={entry.assessment.needScore}
                    tone={headline.tone}
                    isEstimate={headline.isEstimate}
                    size={44}
                    label={t(headline.isEstimate ? 'Estimated need {percent}%' : 'Confirmed need {percent}%', {
                      percent: Math.round(entry.assessment.needScore * 100),
                    })}
                  />
                  <span className="er-chevron" aria-hidden="true">
                    {isExpanded ? <IconChevronUp size={18} aria-hidden="true" /> : <IconChevronDown size={18} aria-hidden="true" />}
                  </span>
                </button>
                {isExpanded && <ProductDetail entry={entry} household={household} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
