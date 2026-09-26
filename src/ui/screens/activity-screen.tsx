import { IconAlertTriangle, IconCircleCheck, IconMinus, IconPlus, IconShoppingBag } from '@tabler/icons-react';
import { observationLabel } from 'src/domain/presentation';
import type { NeedTone } from 'src/domain/presentation';
import type { ObservationSource, ObservationType } from 'src/domain/types';
import { EmptyState } from 'src/ui/components';
import { useI18n } from 'src/ui/i18n';
import type { Translate } from 'src/ui/i18n';
import type { Household } from 'src/ui/use-household';

const MAX_ENTRIES = 150;

const TYPE_TONE: Record<ObservationType, NeedTone> = {
  PURCHASED: 'low',
  CONSUMED: 'medium',
  EMPTY: 'high',
  SEEN_IN_STOCK: 'confirmed',
  MANUAL_NEED: 'high',
};

const TYPE_ICON = {
  PURCHASED: IconShoppingBag,
  CONSUMED: IconMinus,
  EMPTY: IconAlertTriangle,
  SEEN_IN_STOCK: IconCircleCheck,
  MANUAL_NEED: IconPlus,
} as const;

const SOURCE_LABELS: Record<ObservationSource, string> = {
  APP: 'In the app',
  SHOPPING_LIST: 'Shopping list',
  DEMO: 'Demo data',
  IMPORT: 'Import',
  API: 'API',
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const dayLabel = (date: Date, now: Date, t: Translate, locale: string) => {
  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (dayKey(date) === dayKey(now)) {
    return t('Today');
  }
  if (dayKey(date) === dayKey(yesterday)) {
    return t('Yesterday');
  }

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const ActivityScreen = ({ household }: { household: Household }) => {
  const { snapshot, now } = household;
  const { t, lang, locale } = useI18n();
  const productsById = new Map((snapshot?.products ?? []).map((product) => [product.id, product]));
  const entries = [...(snapshot?.observations ?? [])]
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, MAX_ENTRIES);

  if (entries.length === 0) {
    return (
      <EmptyState title={t('Nothing here yet')}>
        {t('Everything you log — bought, all out, still there — shows up here. It\'s exactly what the suggestions are built on.')}
      </EmptyState>
    );
  }

  const groups: { label: string; entries: typeof entries }[] = [];

  for (const entry of entries) {
    const label = dayLabel(entry.observedAt, now, t, locale);
    const group = groups[groups.length - 1];

    if (group && group.label === label) {
      group.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  }

  return (
    <div className="er-stack">
      <p className="er-reason" style={{ margin: 0 }}>
        {t('Everything the suggestions are built on — newest first.')}
      </p>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h2 className="er-section-title">{group.label}</h2>
          <ul className="er-card er-timeline">
            {group.entries.map((entry) => {
              const product = productsById.get(entry.productId);
              const unit = product?.defaultUnit ? ` ${product.defaultUnit}` : '';

              return (
                <li key={entry.id}>
                  <span className="er-event-icon" data-tone={TYPE_TONE[entry.type]} aria-hidden="true">
                    {(() => {
                      const EventIcon = TYPE_ICON[entry.type];

                      return <EventIcon size={18} stroke={1.75} aria-hidden="true" />;
                    })()}
                  </span>
                  <div>
                    <strong>{product?.name ?? t('Deleted product')}</strong> —{' '}
                    {observationLabel(entry.type, lang).toLocaleLowerCase(locale)}
                    {entry.quantity !== null && ` (${entry.quantity}${unit})`}
                    <div className="er-time">
                      {entry.observedAt.toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {entry.source && ` · ${t(SOURCE_LABELS[entry.source])}`}
                      {entry.note && ` · ${entry.note}`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
