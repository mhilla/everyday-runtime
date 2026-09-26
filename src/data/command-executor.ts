import type { HouseholdActions } from 'src/data/household-actions';
import { parseCommand } from 'src/domain/commands';
import type { Command, CommandItem } from 'src/domain/commands';
import type { ProductPrices } from 'src/domain/deals';
import { amount, money, msg } from 'src/domain/messages';
import type { Message } from 'src/domain/messages';
import type { HouseholdSnapshot, ProductOverview } from 'src/domain/shopping';
import { answerQuestion, matchProduct } from 'src/domain/talk';
import { toDisplayName } from 'src/domain/quick-add';
import type { Product } from 'src/domain/types';

export type TalkResult = {
  command: Command;
  replies: Message[];
  changed: boolean;
};

// Runs one sentence: questions are answered from the current data, reports
// become the same actions the buttons use. Shared by the in-app talk box and
// the AI tool, so both behave identically.
export const executeCommand = async (
  input: string | Command,
  context: {
    actions: HouseholdActions;
    snapshot: HouseholdSnapshot;
    overview: ProductOverview[];
    prices: Map<string, ProductPrices>;
  },
): Promise<TalkResult> => {
  const command = typeof input === 'string' ? parseCommand(input) : input;
  const { actions, snapshot, overview, prices } = context;
  const lang = command.lang;

  if (command.intent === 'UNKNOWN') {
    return { command, replies: [msg('talk.notUnderstood')], changed: false };
  }

  const answer = answerQuestion(command, overview, prices, lang);

  if (answer) {
    return { command, replies: answer, changed: false };
  }

  const products = snapshot.products;
  const openItems = snapshot.shoppingItems.filter((item) => item.status === 'OPEN');
  const overviewFor = (product: Product) =>
    overview.find((entry) => entry.product.id === product.id) ?? null;
  const ensureProduct = async (item: CommandItem) =>
    matchProduct(products, item.name) ??
    (await actions.createProduct(toDisplayName(item.name), products));
  const replies: Message[] = [];

  for (const item of command.items) {
    if (command.intent === 'ADD') {
      const known = matchProduct(products, item.name);
      const result = await actions.quickAddToList(
        `${item.quantity ?? ''} ${known?.name ?? item.name}`.trim(),
        products,
        openItems,
      );

      if (result) {
        replies.push(msg(result.alreadyOnList ? 'talk.alreadyOnList' : 'talk.added', { name: result.productName }));
      }
      continue;
    }

    if (command.intent === 'IN_STOCK') {
      const product = matchProduct(products, item.name);
      const entry = product ? overviewFor(product) : null;

      if (!product || !entry) {
        replies.push(msg('talk.unknownProduct', { name: item.name }));
        continue;
      }
      await actions.markInStock(entry);
      replies.push(msg('talk.inStock', { name: product.name }));
      continue;
    }

    const product = await ensureProduct(item);

    if (!product) {
      replies.push(msg('talk.unknownProduct', { name: item.name }));
      continue;
    }

    const entry = overviewFor(product) ?? {
      product,
      assessment: null as never,
      openItem: null,
      isSuggestionSuppressed: false,
      lastObservation: null,
    };

    if (command.intent === 'EMPTY') {
      await actions.markEmpty(entry);
      replies.push(msg('talk.markedEmpty', { name: product.name }));
      continue;
    }

    // BOUGHT: a price given for a single item belongs to it.
    const quantity = item.quantity ?? product.typicalPurchaseQuantity ?? 1;
    const priceAmount = command.items.length === 1 ? command.price : null;
    const openItem = openItems.find((open) => open.productId === product.id) ?? null;

    await actions.markPurchased(openItem, product, {
      quantity,
      priceAmount,
      store: command.store,
    });
    replies.push(
      msg('talk.bought', {
        amount: amount(quantity, product.defaultUnit ? ` ${product.defaultUnit} ${product.name}`.trim() : product.name),
        hasPrice: priceAmount !== null ? 1 : 0,
        price: priceAmount !== null ? money(priceAmount, 'EUR') : '',
        store: command.store ?? '',
      }),
    );
  }

  return { command, replies, changed: true };
};
