import { OBSERVATION_LABELS } from 'src/domain/presentation';
import type { NeedTone } from 'src/domain/presentation';
import type { ObservationSource, ObservationType } from 'src/domain/types';
import { EmptyState } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';

const MAX_ENTRIES = 150;

const TYPE_TONE: Record<ObservationType, NeedTone> = {
  PURCHASED: 'low',
  CONSUMED: 'medium',
  EMPTY: 'high',
  SEEN_IN_STOCK: 'confirmed',
  MANUAL_NEED: 'high',
};

const SOURCE_LABELS: Record<ObservationSource, string> = {
  APP: 'In the app',
  SHOPPING_LIST: 'Shopping list',
  DEMO: 'Demo data',
  IMPORT: 'Import',
  API: 'API',
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const dayLabel = (date: Date, now: Date) => {
  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (dayKey(date) === dayKey(now)) {
    return 'Today';
  }
  if (dayKey(date) === dayKey(yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const ActivityScreen = ({ household }: { household: Household }) => {
  const { snapshot, now } = household;
  const productsById = new Map((snapshot?.products ?? []).map((product) => [product.id, product]));
  const entries = [...(snapshot?.observations ?? [])]
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    .slice(0, MAX_ENTRIES);

  if (entries.length === 0) {
    return (
      <EmptyState title="No activity yet">
        Everything you record — bought, empty, still there, needed — shows up here. This is
        exactly the evidence the suggestions are based on.
      </EmptyState>
    );
  }

  const groups: { label: string; entries: typeof entries }[] = [];

  for (const entry of entries) {
    const label = dayLabel(entry.observedAt, now);
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
        Everything the suggestions are based on, newest first.
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
                  <span className="er-dot" data-tone={TYPE_TONE[entry.type]} aria-hidden="true" />
                  <div>
                    <strong>{product?.name ?? 'Deleted product'}</strong> —{' '}
                    {OBSERVATION_LABELS[entry.type].toLocaleLowerCase()}
                    {entry.quantity !== null && ` (${entry.quantity}${unit})`}
                    <div className="er-time">
                      {entry.observedAt.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {entry.source && ` · ${SOURCE_LABELS[entry.source]}`}
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
