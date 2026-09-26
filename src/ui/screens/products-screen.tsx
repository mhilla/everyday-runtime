import { useState } from 'react';

import {
  CATEGORY_LABELS,
  describeConfidence,
  describeNeed,
  formatPercent,
  formatQuantity,
  OBSERVATION_LABELS,
} from 'src/domain/presentation';
import { sortProductsForBrowsing } from 'src/domain/shopping';
import type { ProductOverview } from 'src/domain/shopping';
import { formatAgo, formatInterval } from 'src/domain/time';
import { ariaBool, BuyPanel, EmptyState, EvidenceChip, NeedMeter, QuickAddForm, WhyPanel } from 'src/ui/components';
import { WelcomeState } from 'src/ui/screens/now-screen';
import type { Household } from 'src/ui/use-household';

const ProductDetail = ({
  entry,
  household,
}: {
  entry: ProductOverview;
  household: Household;
}) => {
  const [isBuying, setIsBuying] = useState(false);
  const { run, busyKey, snapshot, now } = household;
  const { product, assessment } = entry;
  const busy = busyKey !== null;
  const history = (snapshot?.observations ?? [])
    .filter((observation) => observation.productId === product.id)
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, 5);

  return (
    <div id={`er-product-${product.id}`}>
      <p className="er-reason">{assessment.reason}</p>
      <NeedMeter assessment={assessment} />
      <div className="er-chips">
        <EvidenceChip overview={entry} />
        {assessment.calibrationFactor !== null && (
          <span className="er-chip er-chip-muted" title="Adjusted using your earlier Empty / Still have it reports">
            Learned from your corrections
          </span>
        )}
      </div>
      <dl className="er-facts">
        <div className="er-fact">
          <dt>Last bought</dt>
          <dd>{assessment.lastPurchasedAt ? formatAgo(assessment.lastPurchasedAt, now) : '—'}</dd>
        </div>
        <div className="er-fact">
          <dt>Lasts about</dt>
          <dd>{assessment.expectedDurationDays ? formatInterval(assessment.expectedDurationDays) : 'not yet known'}</dd>
        </div>
        {assessment.consumptionRatePerDay !== null ? (
          <div className="er-fact">
            <dt>Use per day</dt>
            <dd>~{formatQuantity(assessment.consumptionRatePerDay, product.defaultUnit)}</dd>
          </div>
        ) : (
          <div className="er-fact">
            <dt>Purchases</dt>
            <dd>{assessment.purchaseCount}</dd>
          </div>
        )}
        <div className="er-fact">
          <dt>Confidence</dt>
          <dd>{describeConfidence(assessment.confidence)}</dd>
        </div>
      </dl>
      <div className="er-actions">
        <button
          type="button"
          className="er-btn er-btn-small"
          disabled={busy}
          onClick={() => run(product.id, (actions) => actions.markEmpty(entry), `${product.name} marked empty`)}
        >
          It’s empty
        </button>
        <button
          type="button"
          className="er-btn er-btn-small"
          disabled={busy}
          onClick={() => run(product.id, (actions) => actions.markInStock(entry), `Noted: you still have ${product.name}`)}
        >
          Still have it
        </button>
        <button
          type="button"
          className="er-btn er-btn-small"
          aria-expanded={ariaBool(isBuying)}
          onClick={() => setIsBuying((value) => !value)}
        >
          Bought
        </button>
        {entry.openItem === null && (
          <button
            type="button"
            className="er-btn er-btn-primary er-btn-small"
            disabled={busy}
            onClick={() => run(product.id, (actions) => actions.addManually(entry), `${product.name} added to your list`)}
          >
            Add to list
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
            run(product.id, (actions) => actions.markPurchased(entry.openItem, product, details), `${product.name} bought`)
          }
        />
      )}
      <WhyPanel assessment={assessment} id={`er-product-why-${product.id}`} />
      {history.length > 0 && (
        <>
          <h3 className="er-section-title">Recent activity</h3>
          <ul className="er-timeline">
            {history.map((observation) => (
              <li key={observation.id}>
                <div>
                  <strong>{OBSERVATION_LABELS[observation.type]}</strong>
                  {observation.quantity !== null && ` · ${observation.quantity}`}
                  <div className="er-time">
                    {formatAgo(observation.observedAt, now)}
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
          onClick={() => run(product.id, (actions) => actions.archiveProduct(entry), `${product.name} archived`)}
        >
          Archive product
        </button>
      </div>
    </div>
  );
};

export const ProductsScreen = ({ household }: { household: Household }) => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { overview, busyKey, run, snapshot } = household;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = sortProductsForBrowsing(overview).filter((entry) =>
    entry.product.name.toLocaleLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="er-stack">
      <h2 className="er-visually-hidden">Products</h2>
      <QuickAddForm
        label="Find or add a product"
        placeholder="Find or add a product…"
        submitLabel="Add"
        busy={busyKey !== null}
        value={query}
        onChange={setQuery}
        onSubmit={(value) =>
          run('new-product', (actions) => actions.createProduct(value, snapshot?.products ?? []), 'Product saved')
        }
      />

      {overview.length === 0 ? (
        <WelcomeState household={household} />
      ) : visible.length === 0 ? (
        <EmptyState title="No product with that name">
          Press “Add” to create “{query.trim()}”.
        </EmptyState>
      ) : (
        <ul className="er-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visible.map((entry) => {
            const headline = describeNeed(entry.assessment);
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
                  <span className="er-dot" data-tone={headline.tone} aria-hidden="true" />
                  <span>
                    <span className="er-name">{entry.product.name}</span>
                    <span className="er-product-meta" style={{ display: 'block' }}>
                      {headline.label}
                      {entry.assessment.state !== 'UNKNOWN' && ` · ${formatPercent(entry.assessment.needScore)}`}
                      {entry.product.category && ` · ${CATEGORY_LABELS[entry.product.category]}`}
                      {entry.openItem && ' · on your list'}
                    </span>
                  </span>
                  <span className="er-chevron" aria-hidden="true">
                    {isExpanded ? '▴' : '▾'}
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
