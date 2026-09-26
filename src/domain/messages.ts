// Structured, translatable messages for everything the domain explains.
// The engine builds messages; `renderMessage` turns them into English or
// German text. English output is byte-for-byte what the engine produced
// before messages existed, so explanations and the JSON API stay stable.

export type Lang = 'en' | 'de';

export type MessageValue =
  | string
  | number
  | Message
  | { kind: 'ago'; days: number }
  | { kind: 'interval'; days: number }
  | { kind: 'amount'; value: number; unit: string | null; plural?: boolean }
  | { kind: 'money'; amount: number; currency: string | null }
  | { kind: 'agoFrom'; from: Date; now: Date };

export type Message = { key: MessageKey; values?: Record<string, MessageValue> };

export const msg = (key: MessageKey, values?: Record<string, MessageValue>): Message =>
  values ? { key, values } : { key };

export const ago = (from: Date, now: Date): MessageValue => ({
  kind: 'ago',
  days: Math.floor((now.getTime() - from.getTime()) / 86_400_000 + 1e-9),
});
export const interval = (days: number): MessageValue => ({ kind: 'interval', days });
export const amount = (
  value: number,
  unit: string | null,
  options: { plural?: boolean } = {},
): MessageValue => ({ kind: 'amount', value, unit, plural: options.plural });
export const money = (value: number, currency: string | null): MessageValue => ({
  kind: 'money',
  amount: value,
  currency,
});

// ---------------------------------------------------------------- formatting

const plural = (lang: Lang, n: number, en: [string, string], de: [string, string]) =>
  (lang === 'en' ? en : de)[n === 1 ? 0 : 1];

const formatAgo = (days: number, lang: Lang): string => {
  if (days <= 0) {
    return lang === 'en' ? 'today' : 'heute';
  }
  if (days === 1) {
    return lang === 'en' ? 'yesterday' : 'gestern';
  }
  if (days < 14) {
    return lang === 'en' ? `${days} days ago` : `vor ${days} Tagen`;
  }
  if (days < 60) {
    const weeks = Math.round(days / 7);

    return lang === 'en' ? `${weeks} weeks ago` : `vor ${weeks} Wochen`;
  }

  const months = Math.round(days / 30);

  return lang === 'en' ? `${months} months ago` : `vor ${months} Monaten`;
};

const formatIntervalText = (days: number, lang: Lang): string => {
  if (days < 1.5) {
    return lang === 'en' ? '~1 day' : '~1 Tag';
  }
  if (days < 13) {
    return lang === 'en' ? `~${Math.round(days)} days` : `~${Math.round(days)} Tage`;
  }
  if (days < 45) {
    const weeks = Math.round(days / 7);

    return `~${weeks} ${plural(lang, weeks, ['week', 'weeks'], ['Woche', 'Wochen'])}`;
  }

  const months = Math.round(days / 30);

  return `~${months} ${plural(lang, months, ['month', 'months'], ['Monat', 'Monate'])}`;
};

const roundAmount = (value: number) =>
  value >= 10
    ? Math.round(value)
    : value >= 0.1
      ? Math.round(value * 10) / 10
      : Math.round(value * 100) / 100;

const decimal = (value: number, lang: Lang) =>
  lang === 'de' ? String(value).replace('.', ',') : String(value);

const formatValue = (value: MessageValue, lang: Lang): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return decimal(value, lang);
  }
  if ('key' in value) {
    return renderMessage(value, lang);
  }
  switch (value.kind) {
    case 'ago':
      return formatAgo(value.days, lang);
    case 'agoFrom':
      return formatAgo(Math.floor((value.now.getTime() - value.from.getTime()) / 86_400_000 + 1e-9), lang);
    case 'interval':
      return formatIntervalText(value.days, lang);
    case 'amount': {
      if (value.plural) {
        // Exact amounts (whole packs): "4 packs", "36 l"; units are user
        // data, so only English word units get a plural "s".
        const exact = Math.round(value.value * 100) / 100;
        const isWord = !!value.unit && value.unit.length > 2 && !value.unit.endsWith('s');
        const unit =
          lang === 'en' && isWord && exact !== 1 ? `${value.unit}s` : value.unit;

        return unit ? `${decimal(exact, lang)} ${unit}` : decimal(exact, lang);
      }

      const rounded = decimal(roundAmount(value.value), lang);

      return value.unit ? `${rounded} ${value.unit}` : rounded;
    }
    case 'money': {
      const fixed = value.amount.toFixed(2);
      const symbol = value.currency === 'EUR' || value.currency === null ? '€' : value.currency;

      return `${lang === 'de' ? fixed.replace('.', ',') : fixed} ${symbol}`;
    }
  }
};

// ------------------------------------------------------------------ catalogs

type Values = Record<string, string>;
type Numbers = Record<string, number>;
type Entry = (v: Values, n: Numbers) => string;

const EN = {
  // reasons
  'reason.noHistory': () => 'No history yet',
  'reason.usedNoPurchases': () => 'Used recently, but no purchases recorded yet',
  'reason.markedEmpty': (v) => `Marked empty ${v.ago}`,
  'reason.addedAsNeeded': (v) => `Added as needed ${v.ago}`,
  'reason.conflict': (v) => `Conflicting reports: ${v.need} ${v.ago}, then seen in stock`,
  'reason.seenInStock': (v) => `Seen in stock ${v.ago}`,
  'reason.seenNoPurchases': (v) => `Seen in stock ${v.ago} · no purchase history yet`,
  'reason.bought': (v) => `Bought ${v.ago}`,
  'reason.boughtWith': (v) => `Bought ${v.ago} · ${v.duration}`,
  'reason.seenLastPurchased': (v) => `Seen in stock ${v.ago} · last purchased ${v.purchased}`,
  'reason.stale': (v) => `Last purchased ${v.ago} · pattern may be out of date`,
  'reason.seenWith': (v) => `Seen in stock ${v.ago} · ${v.duration}`,
  'reason.lastPurchasedWith': (v) => `Last purchased ${v.ago} · ${v.duration}`,
  'reason.singlePurchase': (v) => `Last purchased ${v.ago} · only one purchase so far`,
  'duration.usualInterval': (v) => `usual interval ${v.interval}`,
  'duration.quantityLasts': (v) => `${v.amount} usually lasts ${v.interval}`,
  'duration.usuallyLasts': (v) => `usually lasts ${v.interval}`,
  'need.markedEmpty': () => 'marked empty',
  'need.addedAsNeeded': () => 'added as needed',
  // factors
  'factor.nothingRecorded': () =>
    'Nothing has been recorded for this product yet. Mark it as bought, empty or in stock to start learning.',
  'factor.markedEmpty': (v) => `Marked empty ${v.ago} — a direct report, so it counts as confirmed.`,
  'factor.addedAsNeeded': (v) => `Added as needed ${v.ago} — a direct request, so it counts as confirmed.`,
  'factor.reportAging': () =>
    'That report is getting old and nothing was bought since, so the estimate is less certain.',
  'factor.conflict': (v) =>
    `It was ${v.need} ${v.needAgo}, but seen in stock ${v.seenAgo} with no purchase in between.`,
  'factor.conflictWeight': () =>
    'The most recent report weighs more, but confidence is low until someone checks again.',
  'factor.onlyConsumption': () =>
    'Only consumption was recorded. Record a purchase or mark it empty to get an estimate.',
  'factor.seenStillThere': (v) => `Seen in stock ${v.ago}, so it is very likely still there.`,
  'factor.seen': (v) => `Seen in stock ${v.ago}.`,
  'factor.guessWithoutPurchases': () =>
    'Without any recorded purchase the engine can only guess how fast it is used.',
  'factor.basedOnPurchases': (v) => `Based on ${v.count} purchases, last one ${v.ago}.`,
  'factor.onePurchase': (v) =>
    `Only one purchase so far (${v.ago}); assuming a typical rhythm of ${v.interval} until there is more history.`,
  'factor.oneInterval': (v) => `Only one interval so far (${v.interval}), so the rhythm is a first guess.`,
  'factor.regular': (v) => `Purchases are regular: usually every ${v.interval}.`,
  'factor.irregular': (v) =>
    `Purchases are irregular (between ${v.shortest.replace('~', '')} and ${v.longest.replace('~', '')} apart), so this is a rough estimate.`,
  'factor.quantityRate': (v) =>
    `Bought ${v.amount} last time and you use about ${v.rate} per day, so it should last ${v.interval}.`,
  'factor.learned': (v, n) =>
    `Learned from ${n.signals === 1 ? 'one earlier “Empty”/“Still have it” report' : `${v.signals} earlier “Empty”/“Still have it” reports`}: it usually lasts about ${v.percent}% ${n.shorter === 1 ? 'less' : 'longer'} than expected, so the estimate is adjusted to ${v.interval}.`,
  'factor.seenPushesBack': (v) => `Seen in stock ${v.ago}, which pushes the estimate back.`,
  'factor.usedAmount': (v) => `Used ${v.used} of ${v.bought} since the last purchase, so it may run out sooner.`,
  'factor.usedTimes': (v, n) =>
    `Used ${n.count === 1 ? 'once' : `${v.count} times`} since the last purchase, so it may run out sooner.`,
  'factor.ranOut': (v, n) => `Expected to have run out ${n.ago === 0 ? 'about now' : v.ago}.`,
  'factor.lastsMore': (v, n) => `Expected to last about ${v.days} more day${n.days === 1 ? '' : 's'}.`,
  'factor.stale': () =>
    'The last evidence is old compared to the usual rhythm, so the estimate carries little weight.',
  'factor.ignoredFuture': (v, n) =>
    `Ignored ${v.count} observation${n.count === 1 ? '' : 's'} dated in the future.`,
  // prices
  'price.notEnough': () => 'Not enough prices yet to say whether this is cheap. Every price you log helps.',
  'price.great': (v, n) =>
    `${v.percent}% below your usual price (usually ${v.usual}${v.per})${n.lowest === 1 ? ' — lowest in 90 days' : ''}.`,
  'price.good': (v) => `${v.percent}% below your usual price (usually ${v.usual}${v.per}).`,
  'price.expensive': (v) => `${v.percent}% above your usual price (usually ${v.usual}${v.per}).`,
  'price.normal': (v) => `About your usual price (usually ${v.usual}${v.per}).`,
  'stock.good': (v, n) =>
    `Good price: buy ${v.amount} — lasts about ${v.days} days${n.limit === 1 ? ' (limited by shelf life)' : n.limit === 2 ? ' (limited by storage)' : ''}${v.saving ? `, saves about ${v.saving}` : ''}.`,
  'stock.normal': (v) => `Buy ${v.amount} — enough for about ${v.days} days. Not worth stocking up at this price.`,
  // questions
  'question.conflict': () => 'Reports disagree — one answer settles it.',
  'question.probablyNeeded': (v) => `Probably needed (${v.percent}%), but the estimate is uncertain.`,
  'question.mightBeNeeded': (v) => `Might be needed soon (${v.percent}%) — a quick check avoids a surprise.`,
  // talk (conversation replies)
  'talk.notUnderstood': () =>
    'Sorry, I did not get that. Try “milk is empty”, “add 2 coffee”, “bought milk for 1.19”, “what do we need?” or “is coffee cheap?”.',
  'talk.needsNone': () => 'Nothing looks low right now.',
  'talk.needsIntro': (v, n) => `${n.count === 1 ? 'One thing is' : `${v.count} things are`} probably needed:`,
  'talk.needsLine': (v) => `${v.name} — ${v.label} (${v.percent}%)${v.onList}`,
  'talk.onList': () => ', on the list',
  'talk.unknownProduct': (v) => `I don't know “${v.name}” yet.`,
  'talk.productStatus': (v) => `${v.name}: ${v.label} (${v.percent}%). ${v.reason}.`,
  'talk.priceNone': (v) => `No prices for ${v.name} yet. Log one when you see it.`,
  'talk.priceStatus': (v, n) =>
    `${v.name} usually costs ${v.usual}${v.per}${n.hasLow === 1 ? `; lowest in 90 days: ${v.low}${v.per}${v.lowStore ? ` at ${v.lowStore}` : ''}` : ''}.`,
  'talk.markedEmpty': (v) => `Noted: ${v.name} is empty — it's on the list.`,
  'talk.inStock': (v) => `Noted: you still have ${v.name}.`,
  'talk.added': (v) => `${v.name} is on the list.`,
  'talk.alreadyOnList': (v) => `${v.name} was already on the list.`,
  'talk.bought': (v, n) =>
    `Noted: bought ${v.amount}${n.hasPrice === 1 ? ` for ${v.price}` : ''}${v.store ? ` at ${v.store}` : ''}.`,
} satisfies Record<string, Entry>;

export type MessageKey = keyof typeof EN;

const DE: Record<MessageKey, Entry> = {
  'reason.noHistory': () => 'Noch keine Daten',
  'reason.usedNoPurchases': () => 'Kürzlich verbraucht, aber noch kein Einkauf erfasst',
  'reason.markedEmpty': (v) => `${v.ago} als leer gemeldet`,
  'reason.addedAsNeeded': (v) => `${v.ago} als benötigt gemeldet`,
  'reason.conflict': (v) => `Widersprüchlich: ${v.ago} ${v.need}, dann als vorhanden gemeldet`,
  'reason.seenInStock': (v) => `${v.ago} noch vorhanden`,
  'reason.seenNoPurchases': (v) => `${v.ago} noch vorhanden · noch keine Einkäufe erfasst`,
  'reason.bought': (v) => `${v.ago} gekauft`,
  'reason.boughtWith': (v) => `${v.ago} gekauft · ${v.duration}`,
  'reason.seenLastPurchased': (v) => `${v.ago} noch vorhanden · zuletzt gekauft ${v.purchased}`,
  'reason.stale': (v) => `Zuletzt gekauft ${v.ago} · Muster womöglich veraltet`,
  'reason.seenWith': (v) => `${v.ago} noch vorhanden · ${v.duration}`,
  'reason.lastPurchasedWith': (v) => `Zuletzt gekauft ${v.ago} · ${v.duration}`,
  'reason.singlePurchase': (v) => `Zuletzt gekauft ${v.ago} · bisher nur ein Einkauf`,
  'duration.usualInterval': (v) => `üblicher Abstand ${v.interval}`,
  'duration.quantityLasts': (v) => `${v.amount} reichen meist ${v.interval}`,
  'duration.usuallyLasts': (v) => `reicht meist ${v.interval}`,
  'need.markedEmpty': () => 'als leer gemeldet',
  'need.addedAsNeeded': () => 'als benötigt gemeldet',
  'factor.nothingRecorded': () =>
    'Für dieses Produkt wurde noch nichts erfasst. Melde es als gekauft, leer oder vorhanden, damit die App lernen kann.',
  'factor.markedEmpty': (v) => `${v.ago} als leer gemeldet — eine direkte Meldung, daher bestätigt.`,
  'factor.addedAsNeeded': (v) => `${v.ago} als benötigt gemeldet — ein direkter Wunsch, daher bestätigt.`,
  'factor.reportAging': () =>
    'Die Meldung ist schon älter und seitdem wurde nichts gekauft, deshalb ist die Schätzung unsicherer.',
  'factor.conflict': (v) =>
    `Es wurde ${v.needAgo} ${v.need}, aber ${v.seenAgo} als vorhanden gemeldet, ohne Einkauf dazwischen.`,
  'factor.conflictWeight': () =>
    'Die neueste Meldung zählt mehr, aber die Sicherheit bleibt gering, bis jemand nachschaut.',
  'factor.onlyConsumption': () =>
    'Bisher nur Verbrauch erfasst. Erfasse einen Einkauf oder melde „leer“, um eine Schätzung zu bekommen.',
  'factor.seenStillThere': (v) => `${v.ago} als vorhanden gemeldet, also sehr wahrscheinlich noch da.`,
  'factor.seen': (v) => `${v.ago} als vorhanden gemeldet.`,
  'factor.guessWithoutPurchases': () =>
    'Ohne erfasste Einkäufe kann die App nur raten, wie schnell es verbraucht wird.',
  'factor.basedOnPurchases': (v) => `Basierend auf ${v.count} Einkäufen, zuletzt ${v.ago}.`,
  'factor.onePurchase': (v) =>
    `Bisher nur ein Einkauf (${v.ago}); bis mehr Daten da sind, wird ein Rhythmus von ${v.interval} angenommen.`,
  'factor.oneInterval': (v) => `Bisher nur ein Abstand (${v.interval}), der Rhythmus ist also eine erste Schätzung.`,
  'factor.regular': (v) => `Die Einkäufe sind regelmäßig: meist alle ${v.interval}.`,
  'factor.irregular': (v) =>
    `Die Einkäufe sind unregelmäßig (zwischen ${v.shortest.replace('~', '')} und ${v.longest.replace('~', '')} Abstand), das ist nur eine grobe Schätzung.`,
  'factor.quantityRate': (v) =>
    `Zuletzt ${v.amount} gekauft, ihr verbraucht etwa ${v.rate} pro Tag — das sollte ${v.interval} reichen.`,
  'factor.learned': (v, n) =>
    `Gelernt aus ${n.signals === 1 ? 'einer früheren „Leer“/„Noch da“-Meldung' : `${v.signals} früheren „Leer“/„Noch da“-Meldungen`}: Es reicht meist etwa ${v.percent} % ${n.shorter === 1 ? 'kürzer' : 'länger'} als erwartet, deshalb jetzt ${v.interval}.`,
  'factor.seenPushesBack': (v) => `${v.ago} als vorhanden gemeldet, das verschiebt die Schätzung nach hinten.`,
  'factor.usedAmount': (v) => `Seit dem letzten Einkauf ${v.used} von ${v.bought} verbraucht, es könnte früher ausgehen.`,
  'factor.usedTimes': (v, n) =>
    `Seit dem letzten Einkauf ${n.count === 1 ? 'einmal' : `${v.count}-mal`} verbraucht, es könnte früher ausgehen.`,
  'factor.ranOut': (v, n) => `Sollte ${n.ago === 0 ? 'ungefähr jetzt' : v.ago} ausgegangen sein.`,
  'factor.lastsMore': (v, n) => `Sollte noch etwa ${v.days} ${n.days === 1 ? 'Tag' : 'Tage'} reichen.`,
  'factor.stale': () =>
    'Die letzten Daten sind im Vergleich zum üblichen Rhythmus alt, die Schätzung hat daher wenig Gewicht.',
  'factor.ignoredFuture': (v, n) =>
    `${v.count} ${n.count === 1 ? 'Meldung' : 'Meldungen'} mit Datum in der Zukunft ignoriert.`,
  'price.notEnough': () =>
    'Noch zu wenige Preise, um zu sagen, ob das günstig ist. Jeder erfasste Preis hilft.',
  'price.great': (v, n) =>
    `${v.percent} % unter deinem üblichen Preis (sonst ${v.usual}${v.per})${n.lowest === 1 ? ' — günstigster seit 90 Tagen' : ''}.`,
  'price.good': (v) => `${v.percent} % unter deinem üblichen Preis (sonst ${v.usual}${v.per}).`,
  'price.expensive': (v) => `${v.percent} % über deinem üblichen Preis (sonst ${v.usual}${v.per}).`,
  'price.normal': (v) => `Etwa dein üblicher Preis (sonst ${v.usual}${v.per}).`,
  'stock.good': (v, n) =>
    `Guter Preis: ${v.amount} kaufen — reicht etwa ${v.days} Tage${n.limit === 1 ? ' (begrenzt durch Haltbarkeit)' : n.limit === 2 ? ' (begrenzt durch Lagerplatz)' : ''}${v.saving ? `, spart etwa ${v.saving}` : ''}.`,
  'stock.normal': (v) => `${v.amount} kaufen — reicht etwa ${v.days} Tage. Vorrat lohnt sich zu diesem Preis nicht.`,
  'question.conflict': () => 'Die Meldungen widersprechen sich — eine Antwort klärt es.',
  'question.probablyNeeded': (v) => `Wahrscheinlich nötig (${v.percent} %), aber die Schätzung ist unsicher.`,
  'question.mightBeNeeded': (v) => `Bald nötig? (${v.percent} %) — ein kurzer Blick vermeidet Überraschungen.`,
  'talk.notUnderstood': () =>
    'Das habe ich nicht verstanden. Probier z. B. „Milch ist leer“, „2 Kaffee auf die Liste“, „Milch für 1,19 gekauft“, „Was brauchen wir?“ oder „Ist Kaffee günstig?“.',
  'talk.needsNone': () => 'Gerade wird nichts knapp.',
  'talk.needsIntro': (v, n) => `${n.count === 1 ? 'Eine Sache ist' : `${v.count} Sachen sind`} wahrscheinlich nötig:`,
  'talk.needsLine': (v) => `${v.name} — ${v.label} (${v.percent} %)${v.onList}`,
  'talk.onList': () => ', steht auf der Liste',
  'talk.unknownProduct': (v) => `„${v.name}“ kenne ich noch nicht.`,
  'talk.productStatus': (v) => `${v.name}: ${v.label} (${v.percent} %). ${v.reason}.`,
  'talk.priceNone': (v) => `Für ${v.name} gibt es noch keine Preise. Trag einen ein, wenn du ihn siehst.`,
  'talk.priceStatus': (v, n) =>
    `${v.name} kostet üblicherweise ${v.usual}${v.per}${n.hasLow === 1 ? `; am günstigsten in 90 Tagen: ${v.low}${v.per}${v.lowStore ? ` bei ${v.lowStore}` : ''}` : ''}.`,
  'talk.markedEmpty': (v) => `Notiert: ${v.name} ist leer — steht jetzt auf der Liste.`,
  'talk.inStock': (v) => `Notiert: ${v.name} ist noch da.`,
  'talk.added': (v) => `${v.name} steht auf der Liste.`,
  'talk.alreadyOnList': (v) => `${v.name} stand schon auf der Liste.`,
  'talk.bought': (v, n) =>
    `Notiert: ${v.amount} gekauft${n.hasPrice === 1 ? ` für ${v.price}` : ''}${v.store ? ` bei ${v.store}` : ''}.`,
};

const CATALOGS: Record<Lang, Record<MessageKey, Entry>> = { en: EN, de: DE };

export const renderMessage = (message: Message, lang: Lang): string => {
  const values: Values = {};
  const numbers: Numbers = {};

  for (const [name, value] of Object.entries(message.values ?? {})) {
    values[name] = formatValue(value, lang);
    if (typeof value === 'number') {
      numbers[name] = value;
    } else if (typeof value === 'object' && 'kind' in value && value.kind === 'ago') {
      numbers[name] = value.days;
    }
  }

  return CATALOGS[lang][message.key](values, numbers);
};

export const agoText = (from: Date, now: Date, lang: Lang) => formatValue(ago(from, now), lang);
export const intervalText = (days: number, lang: Lang) => formatIntervalText(days, lang);
export const moneyText = (value: number, currency: string | null, lang: Lang) =>
  formatValue(money(value, currency), lang);
