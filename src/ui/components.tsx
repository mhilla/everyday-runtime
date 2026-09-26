import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import {
  describeConfidence,
  describeNeed,
  formatPercent,
  formatQuantity,
} from 'src/domain/presentation';
import type { ProductOverview } from 'src/domain/shopping';
import type { NeedAssessment, Product } from 'src/domain/types';

// Remote DOM serializes boolean attributes as empty strings, which screen
// readers read as "false"; ARIA states therefore get explicit strings.
export const ariaBool = (value: boolean): 'true' | 'false' =>
  value ? 'true' : 'false';

export const NeedMeter = ({ assessment }: { assessment: NeedAssessment }) => {
  const headline = describeNeed(assessment);
  const percent = Math.round(assessment.needScore * 100);

  return (
    <div
      className="er-meter"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`${headline.isEstimate ? 'Estimated' : 'Confirmed'} need ${percent}%`}
    >
      <div
        className="er-meter-fill"
        data-tone={headline.tone}
        data-estimate={String(headline.isEstimate)}
        style={{ width: `${Math.max(4, percent)}%` }}
      />
    </div>
  );
};

// Shows at a glance whether a line is a fact someone reported or a guess.
export const EvidenceChip = ({ overview }: { overview: ProductOverview }) => {
  const headline = describeNeed(overview.assessment);

  return (
    <>
      {overview.openItem && <span className="er-chip er-chip-list">On your list</span>}
      {headline.isEstimate ? (
        <span className="er-chip er-chip-estimate" title="Estimated from past activity">
          Estimate
        </span>
      ) : (
        <span className="er-chip er-chip-confirmed" title="Based on something you reported">
          Confirmed
        </span>
      )}
    </>
  );
};

export const WhyPanel = ({
  assessment,
  id,
}: {
  assessment: NeedAssessment;
  id: string;
}) => (
  <div className="er-why" id={id}>
    <p>
      <strong>Why?</strong> {formatPercent(assessment.needScore)} likely needed ·{' '}
      {describeConfidence(assessment.confidence)} ({formatPercent(assessment.confidence)})
    </p>
    <ul>
      {assessment.factors.map((factor) => (
        <li key={factor}>{factor}</li>
      ))}
    </ul>
    {describeNeed(assessment).isEstimate && (
      <p className="er-fine-print">
        This is an estimate from past activity, not a stock count. Tap “Still have it” or
        “Empty” to correct it.
      </p>
    )}
  </div>
);

export const NeedCard = ({
  overview,
  busy,
  children,
}: {
  overview: ProductOverview;
  busy: boolean;
  children?: ReactNode;
}) => {
  const [showWhy, setShowWhy] = useState(false);
  const { product, assessment } = overview;
  const headline = describeNeed(assessment);
  const whyId = `er-why-${product.id}`;

  return (
    <article className="er-card" aria-busy={ariaBool(busy)} aria-label={product.name}>
      <div className="er-row-top">
        <div>
          <h3 className="er-name">{product.name}</h3>
          <p className={`er-headline er-tone-${headline.tone}`}>{headline.label}</p>
        </div>
        <div>
          <span className={`er-percent er-tone-${headline.tone}`}>
            {formatPercent(assessment.needScore)}
          </span>
          <span className="er-percent-label">likely needed</span>
        </div>
      </div>
      <p className="er-reason">{assessment.reason}</p>
      <NeedMeter assessment={assessment} />
      <div className="er-chips">
        <EvidenceChip overview={overview} />
      </div>
      <div className="er-actions">
        {children}
        <button
          type="button"
          className="er-btn er-btn-ghost er-btn-small"
          aria-expanded={ariaBool(showWhy)}
          aria-controls={whyId}
          onClick={() => setShowWhy((value) => !value)}
        >
          {showWhy ? 'Hide reason' : 'Why?'}
        </button>
      </div>
      {showWhy && <WhyPanel assessment={assessment} id={whyId} />}
    </article>
  );
};

const parseDecimal = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');

  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export type BuyDetails = {
  quantity: number;
  priceAmount: number | null;
  store: string | null;
};

// Inline form to confirm a purchase with quantity and (optional) price.
export const BuyPanel = ({
  product,
  initialQuantity,
  busy,
  onConfirm,
  onCancel,
}: {
  product: Product;
  initialQuantity: number;
  busy: boolean;
  onConfirm: (details: BuyDetails) => void;
  onCancel: () => void;
}) => {
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const step = quantity < 1 ? 0.25 : 1;
  const idPrefix = `er-buy-${product.id}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      quantity,
      priceAmount: parseDecimal(price),
      store: store.trim() === '' ? null : store.trim(),
    });
  };

  return (
    <form className="er-buy" onSubmit={submit} aria-label={`Buy ${product.name}`}>
      <div className="er-buy-grid">
        <div>
          <span className="er-label" id={`${idPrefix}-qty`}>
            Quantity{product.defaultUnit ? ` (${product.defaultUnit})` : ''}
          </span>
          <div className="er-stepper" role="group" aria-labelledby={`${idPrefix}-qty`}>
            <button
              type="button"
              className="er-btn er-btn-small"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((value) => Math.max(step, value - step))}
            >
              −
            </button>
            <span className="er-stepper-value" aria-live="polite">
              {formatQuantity(quantity, null)}
            </span>
            <button
              type="button"
              className="er-btn er-btn-small"
              aria-label="Increase quantity"
              onClick={() => setQuantity((value) => value + step)}
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="er-label" htmlFor={`${idPrefix}-price`}>
            Price (optional)
          </label>
          <input
            id={`${idPrefix}-price`}
            className="er-input"
            inputMode="decimal"
            placeholder="e.g. 1.19"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div>
          <label className="er-label" htmlFor={`${idPrefix}-store`}>
            Store (optional)
          </label>
          <input
            id={`${idPrefix}-store`}
            className="er-input"
            placeholder="e.g. Corner shop"
            value={store}
            onChange={(event) => setStore(event.target.value)}
          />
        </div>
      </div>
      <div className="er-actions">
        <button type="submit" className="er-btn er-btn-primary" disabled={busy}>
          {busy ? 'Saving…' : `Bought ${formatQuantity(quantity, product.defaultUnit)}`}
        </button>
        <button type="button" className="er-btn er-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export const QuickAddForm = ({
  label,
  placeholder,
  submitLabel,
  busy,
  onSubmit,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (value: string) => void;
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const [ownValue, setOwnValue] = useState('');
  const current = value ?? ownValue;
  const setCurrent = onChange ?? setOwnValue;
  const inputId = `er-quick-${label.replace(/\W+/g, '-').toLowerCase()}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (current.trim() === '') {
      return;
    }
    onSubmit(current);
    setCurrent('');
  };

  return (
    <form className="er-form" onSubmit={submit} aria-label={label}>
      <label className="er-visually-hidden" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="er-input"
        placeholder={placeholder}
        value={current}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(event) => setCurrent(event.target.value)}
      />
      <button
        type="submit"
        className="er-btn er-btn-primary"
        disabled={busy || current.trim() === ''}
      >
        {submitLabel}
      </button>
    </form>
  );
};

export const EmptyState = ({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="er-card er-empty">
    <h2>{title}</h2>
    <p>{children}</p>
    {actions && <div className="er-actions">{actions}</div>}
  </div>
);
