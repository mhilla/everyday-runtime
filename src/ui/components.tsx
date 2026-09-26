import { IconInfoCircle, IconShoppingBag } from '@tabler/icons-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import {
  describeConfidence,
  describeNeed,
  formatPercent,
  formatQuantity,
} from 'src/domain/presentation';
import type { ProductOverview } from 'src/domain/shopping';
import { renderMessage } from 'src/domain/messages';
import type { NeedAssessment, Product } from 'src/domain/types';
import { Icon, NeedGauge, ProductAvatar } from 'src/ui/design';
import { useI18n } from 'src/ui/i18n';

// Remote DOM serializes boolean attributes as empty strings, which screen
// readers read as "false"; ARIA states therefore get explicit strings.
export const ariaBool = (value: boolean): 'true' | 'false' =>
  value ? 'true' : 'false';

export const NeedMeter = ({ assessment }: { assessment: NeedAssessment }) => {
  const { t } = useI18n();
  const headline = describeNeed(assessment);
  const percent = Math.round(assessment.needScore * 100);

  return (
    <div
      className="er-meter"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={t(headline.isEstimate ? 'Estimated need {percent}%' : 'Confirmed need {percent}%', { percent })}
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
  const { t } = useI18n();
  const headline = describeNeed(overview.assessment);

  return (
    <>
      {overview.openItem && <span className="er-chip er-chip-list">{t('On your list')}</span>}
      {headline.isEstimate ? (
        <span className="er-chip er-chip-estimate" title={t('Our best guess from your history')}>
          {t('Best guess')}
        </span>
      ) : (
        <span className="er-chip er-chip-confirmed" title={t('Based on something you told us')}>
          {t('You told us')}
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
}) => {
  const { t, lang } = useI18n();

  return (
    <div className="er-why" id={id}>
      <p>
        <strong>{t('Why?')}</strong>{' '}
        {t('{need} likely needed · {confidence} ({confidencePercent})', {
          need: formatPercent(assessment.needScore),
          confidence: describeConfidence(assessment.confidence, lang),
          confidencePercent: formatPercent(assessment.confidence),
        })}
      </p>
      <ul>
        {assessment.factorMessages.map((factor, index) => (
          <li key={index}>{renderMessage(factor, lang)}</li>
        ))}
      </ul>
      {describeNeed(assessment).isEstimate && (
        <p className="er-fine-print">
          {t('This is our best guess, not a stock count. Wrong? Tap “Still have some” or “All out” and it learns.')}
        </p>
      )}
    </div>
  );
};

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
  const { t, lang } = useI18n();
  const { product, assessment } = overview;
  const headline = describeNeed(assessment, lang);
  const whyId = `er-why-${product.id}`;

  return (
    <article className="er-card" aria-busy={ariaBool(busy)} aria-label={product.name}>
      <div className="er-need-top">
        <ProductAvatar category={product.category} />
        <div className="er-need-text">
          <h3 className="er-name">{product.name}</h3>
          <p className={`er-headline er-tone-${headline.tone}`}>{headline.label}</p>
        </div>
        <NeedGauge
          value={assessment.needScore}
          tone={headline.tone}
          isEstimate={headline.isEstimate}
          label={t(headline.isEstimate ? 'Estimated need {percent}%' : 'Confirmed need {percent}%', {
            percent: Math.round(assessment.needScore * 100),
          })}
        />
      </div>
      <p className="er-reason">{renderMessage(assessment.reasonMessage, lang)}</p>
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
          <Icon icon={IconInfoCircle} size={18} />
          {showWhy ? t('Got it') : t('Why?')}
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
  const { t } = useI18n();
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
    <form className="er-buy" onSubmit={submit} aria-label={t('Buy {name}', { name: product.name })}>
      <div className="er-buy-grid">
        <div>
          <span className="er-label" id={`${idPrefix}-qty`}>
            {t('Quantity')}{product.defaultUnit ? ` (${product.defaultUnit})` : ''}
          </span>
          <div className="er-stepper" role="group" aria-labelledby={`${idPrefix}-qty`}>
            <button
              type="button"
              className="er-btn er-btn-small"
              aria-label={t('Decrease quantity')}
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
              aria-label={t('Increase quantity')}
              onClick={() => setQuantity((value) => value + step)}
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="er-label" htmlFor={`${idPrefix}-price`}>
            {t('Price (optional)')}
          </label>
          <input
            id={`${idPrefix}-price`}
            className="er-input"
            inputMode="decimal"
            placeholder={t('e.g. 1.19')}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div>
          <label className="er-label" htmlFor={`${idPrefix}-store`}>
            {t('Store (optional)')}
          </label>
          <input
            id={`${idPrefix}-store`}
            className="er-input"
            placeholder={t('e.g. Corner shop')}
            value={store}
            onChange={(event) => setStore(event.target.value)}
          />
        </div>
      </div>
      <div className="er-actions">
        <button type="submit" className="er-btn er-btn-primary" disabled={busy}>
          {busy ? t('Saving…') : t('Bought {amount}', { amount: formatQuantity(quantity, product.defaultUnit) })}
        </button>
        <button type="button" className="er-btn er-btn-ghost" onClick={onCancel}>
          {t('Cancel')}
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
    <span className="er-empty-icon" aria-hidden="true">
      <IconShoppingBag size={28} stroke={1.75} aria-hidden="true" />
    </span>
    <h2>{title}</h2>
    <p>{children}</p>
    {actions && <div className="er-actions">{actions}</div>}
  </div>
);
