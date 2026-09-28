import { IconCheck, IconShoppingBag, IconX } from '@tabler/icons-react';
import { useState } from 'react';

import { formatPercent, formatQuantity } from 'src/domain/presentation';
import { selectOpenItems, selectSuggestions } from 'src/domain/shopping';
import { agoText, renderMessage } from 'src/domain/messages';
import type { ProductOverview } from 'src/domain/shopping';
import { daysBetween } from 'src/domain/time';
import type { Product, ShoppingItem } from 'src/domain/types';
import { ariaBool, BuyPanel, EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import { ProductAvatar } from 'src/ui/design';
import { useI18n } from 'src/ui/i18n';
import { quickAddFeedback } from 'src/ui/quick-add-feedback';
import type { Household } from 'src/ui/use-household';

const RECENTLY_BOUGHT_DAYS = 7;

const OriginChip = ({ item }: { item: ShoppingItem }) => {
  const { t } = useI18n();

  return item.origin === 'INFERRED' ? (
    <span className="er-chip er-chip-estimate" title={t('Suggested from your history')}>
      {t('Smart pick{confidence}', {
        confidence: item.confidence !== null ? ` · ${formatPercent(item.confidence)}` : '',
      })}
    </span>
  ) : (
    <span className="er-chip er-chip-confirmed">{t('Added by you')}</span>
  );
};

const ListItemRow = ({
  item,
  product,
  overview,
  household,
}: {
  item: ShoppingItem;
  product: Product | null;
  overview: ProductOverview | null;
  household: Household;
}) => {
  const { t, lang } = useI18n();
  const [isBuying, setIsBuying] = useState(false);
  // Suggested items show today's reason in the current language; items added
  // by people show their (translated) note.
  const explanation =
    item.origin === 'INFERRED' && overview
      ? renderMessage(overview.assessment.reasonMessage, lang)
      : item.explanation
        ? t(item.explanation)
        : null;
  const { busyKey, run } = household;
  const busy = busyKey === item.id;

  return (
    <li className="er-card" aria-busy={ariaBool(busy)}>
      <div className="er-item">
        <button
          type="button"
          className="er-check"
          aria-label={t('Mark {name} as bought', { name: item.name })}
          aria-expanded={ariaBool(isBuying)}
          disabled={product === null}
          onClick={() => setIsBuying((value) => !value)}
        >
          <IconCheck size={22} stroke={2.25} aria-hidden="true" />
        </button>
        <ProductAvatar category={product?.category ?? null} size={40} />
        <div className="er-item-body">
          <h3 className="er-name">
            {item.name}{' '}
            <span className="er-qty">
              · {formatQuantity(item.requestedQuantity, product?.defaultUnit ?? null)}
            </span>
          </h3>
          {explanation && <p className="er-reason">{explanation}</p>}
          <div className="er-chips">
            <OriginChip item={item} />
          </div>
        </div>
        <button
          type="button"
          className="er-btn er-btn-ghost er-btn-small"
          aria-label={t('Remove {name} from the list', { name: item.name })}
          disabled={busyKey !== null}
          onClick={() => run(item.id, (actions) => actions.removeFromList(item), t('{name} removed', { name: item.name }))}
        >
          <IconX size={18} stroke={2} aria-hidden="true" />
        </button>
      </div>
      {isBuying && product && (
        <BuyPanel
          product={product}
          initialQuantity={item.requestedQuantity}
          busy={busy}
          onCancel={() => setIsBuying(false)}
          onConfirm={(details) =>
            run(item.id, (actions) => actions.markPurchased(item, product, details), t('Nice — {name} is checked off', { name: item.name }))
          }
        />
      )}
    </li>
  );
};

export const ListScreen = ({ household }: { household: Household }) => {
  const { snapshot, overview, busyKey, run, now } = household;
  const { t, lang } = useI18n();
  const overviewById = new Map(overview.map((entry) => [entry.product.id, entry]));
  const items = snapshot?.shoppingItems ?? [];
  const products = snapshot?.products ?? [];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const openItems = selectOpenItems(items);
  const suggestions = selectSuggestions(overview);
  const recentlyBought = items
    .filter(
      (item) =>
        item.status === 'PURCHASED' &&
        item.purchasedAt !== null &&
        daysBetween(item.purchasedAt, now) <= RECENTLY_BOUGHT_DAYS,
    )
    .sort((a, b) => (b.purchasedAt?.getTime() ?? 0) - (a.purchasedAt?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <div className="er-stack">
      <QuickAddForm
        label={t('Add to shopping list')}
        placeholder={t('Add anything — e.g. 2 milk')}
        submitLabel={t('Add')}
        busy={busyKey !== null}
        onSubmit={(value) =>
          run(
            'quick-add',
            (actions) => actions.quickAddToList(value, products, openItems),
            (result) => quickAddFeedback(result, t),
          )
        }
      />

      <section aria-labelledby="er-tobuy-title">
        <h2 className="er-section-title" id="er-tobuy-title">
          {t('To buy · {count}', { count: openItems.length })}
        </h2>
        {openItems.length === 0 ? (
          <EmptyState title={t('Your list is empty')}>
            {suggestions.length > 0
              ? t('Nothing on it yet. Here\'s what\'s likely to run out next.')
              : t('Add what you need above — we\'ll suggest the rest before it runs out.')}
          </EmptyState>
        ) : (
          <ul className="er-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {openItems.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                product={item.productId ? (productsById.get(item.productId) ?? null) : null}
                overview={item.productId ? (overviewById.get(item.productId) ?? null) : null}
                household={household}
              />
            ))}
          </ul>
        )}
      </section>

      {suggestions.length > 0 && (
        <section aria-labelledby="er-suggest-title">
          <h2 className="er-section-title" id="er-suggest-title">
            {t('Smart picks for you')}
          </h2>
          <div className="er-need-grid">
            {suggestions.map((entry) => (
              <NeedCard key={entry.product.id} overview={entry} busy={busyKey === entry.product.id}>
                <button
                  type="button"
                  className="er-btn er-btn-primary er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.acceptSuggestion(entry), t('{name} added to your list', { name: entry.product.name }))
                  }
                >
                  {t('Add to list')}
                </button>
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.dismissSuggestion(entry), t('Okay, we\'ll hold off on that one'))
                  }
                >
                  {t('Not now')}
                </button>
              </NeedCard>
            ))}
          </div>
        </section>
      )}

      {recentlyBought.length > 0 && (
        <section aria-labelledby="er-bought-title">
          <h2 className="er-section-title" id="er-bought-title">
            {t('Just bought')}
          </h2>
          <ul className="er-card er-timeline">
            {recentlyBought.map((item) => (
              <li key={item.id}>
                <span className="er-event-icon" data-tone="low" aria-hidden="true">
                  <IconShoppingBag size={18} stroke={1.75} aria-hidden="true" />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <div className="er-time">
                    {item.purchasedAt ? agoText(item.purchasedAt, now, lang) : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
