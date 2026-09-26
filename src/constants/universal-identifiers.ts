// Stable universal identifiers (UUID v4) for every synced entity of the app.
// Never change a value once it has been applied to a workspace: Twenty uses
// these identifiers to match local definitions with installed metadata.

export const APP_DISPLAY_NAME = 'Everyday Runtime';
export const APP_DESCRIPTION =
  'An open-source, self-hosted shopping assistant that learns what a household probably needs — without requiring perfect inventory tracking.';
export const APPLICATION_UNIVERSAL_IDENTIFIER = '65f1eff7-ec01-43b6-8300-a65b9a9d7b7f';
export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER = '112501dc-8789-4083-8aea-d75a74a2f8fb';
export const HEALTH_CHECK_UNIVERSAL_IDENTIFIER = '74f84b1a-4a7e-4b62-b7ff-efc5371486f4';

// Layout
export const MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '4b1e0d98-62d5-4171-8535-38b027ff8f78';
export const MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER = 'ce130b25-3c4f-4878-8f66-f7e7a73f73f8';
export const MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER = '31f89298-b3cb-4dc1-9f21-28a1273284ca';
export const MAIN_PAGE_WIDGET_UNIVERSAL_IDENTIFIER = 'b5915876-aef4-4931-a6bd-198ec4658527';
export const MAIN_PAGE_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER =
  'e485a0d8-258b-44d0-ad3f-1a7ef4876fb6';

// Logic functions
export const COMMUNITY_PRICES_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '4ef81d3a-f162-4608-959d-19895cd7fd6f';
export const NEEDS_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'da370b5e-fe9e-4a24-8960-237ca3a371b6';

// Product
export const PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER = 'ac447180-89fb-461a-aabf-6310e541d8e4';
export const PRODUCT_FIELD_IDS = {
  name: '7038ddc5-f21e-4d07-a9d5-0e531028e5fa',
  category: 'a5a49bc3-ddf2-4448-9f37-90c2269c824a',
  defaultUnit: '1f9efa4a-0886-4d82-b847-56c4722dd595',
  barcode: 'c9abcf0d-e91e-4ed9-8620-b72ba85ac175',
  typicalPurchaseQuantity: '04dd5e37-09d9-4e5a-9bfe-89950ff7d0af',
  archived: 'cc32a341-a862-4b55-8972-613c39ee5438',
  observations: '13173c0d-3e16-44d8-bf96-c055d53a4d4d',
  shoppingItems: '50bb6892-6618-4745-b95e-8a9419d8ea3c',
  purchases: '799cca92-d514-4d44-86ee-441f768a8257',
  shelfLifeDays: '144878ae-a3a2-4711-a14f-5af80fb290f1',
  priceAlertUnitPrice: 'f9f524f0-69f8-42df-9ade-b6f6bdc0c9a5',
  priceObservations: 'b0e8828a-2eb0-4a7b-8bdb-56aadc735c3d',
} as const;

// Observation
export const OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER = 'f31e45db-6b1a-485f-bc72-a1340c440128';
export const OBSERVATION_FIELD_IDS = {
  summary: '1b9bf0ac-3c83-417a-9b9a-df0a04e52b40',
  product: '206db121-ad16-4fa4-b894-0d8dd1ac81ec',
  type: '0139e02c-1726-4b45-9f05-afc3e97aadb2',
  quantity: 'c6e96019-26c8-45fa-b8cb-a8be1230a9dd',
  observedAt: 'f8a1ad33-457e-4981-b00a-728878aa015b',
  source: '0a3e58b5-a083-449a-8e9a-d7c677fde24b',
  note: '6a325caf-b639-48c9-895c-db4f3db83f14',
} as const;

// Shopping item
export const SHOPPING_ITEM_OBJECT_UNIVERSAL_IDENTIFIER = 'e98c33de-3eea-4b34-bc1d-436fcf6e3f70';
export const SHOPPING_ITEM_FIELD_IDS = {
  name: 'b27d2da7-e504-4c57-b3dc-32ad03ec3a88',
  product: '412e2fb7-e762-49ab-8b0c-3e65319dec9e',
  requestedQuantity: '25a392a8-4e21-44ec-9606-da7d118c3ca5',
  status: '5a559f7f-49d7-4f64-8d77-09aa432f288c',
  origin: '08b52986-0cb1-48ea-8332-7090d3b63d57',
  confidence: 'a13ca651-bd7d-45bb-b0da-101277664d05',
  explanation: 'cdd79d31-779f-4908-9ce1-3e7ea280685d',
  purchasedAt: '1bccc747-6358-48ab-b739-438c122152b2',
  dismissedAt: '9846433f-670d-4661-99ee-b94fc9273765',
} as const;

// Purchase
export const PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER = 'c18bd205-6efc-449e-9b09-5427277a8af4';
export const PURCHASE_FIELD_IDS = {
  name: '57f03c1e-c7d7-45b1-bd54-19456daa4edf',
  product: '0a71ecb6-0c06-4864-90b2-727476fcaefe',
  quantity: 'c2d74738-493f-4560-ab9f-aa72aeb69b6a',
  purchasedAt: '25c92895-8a93-4f38-978d-68eb6761700e',
  price: 'd8ca0393-d2e0-4620-a1e6-d01d5b78a02e',
  store: '7cc69a85-cae1-407d-8860-17c2ed2d5a8a',
} as const;

// Price observation (a price seen somewhere, not necessarily bought)
export const PRICE_OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER = 'e8583b27-45be-4a01-8c4a-ebfb6f7b5588';
export const PRICE_OBSERVATION_FIELD_IDS = {
  name: '659bf760-c921-4f48-8faa-07e666ee6f54',
  product: 'b60b41d1-1408-43ad-994a-375065dc0806',
  price: 'eb666ff9-039e-4028-84c6-c4a992ceff3c',
  packQuantity: '8f47a63d-7fbc-4248-9a10-65bd60a8827a',
  store: '7ff50699-5eea-43df-b51b-595cce741da4',
  observedAt: '2fc7745f-1ffa-4f0d-8595-311332bf30d8',
  source: 'f0cc6fac-bba0-4a1e-bcd9-899ec11b5619',
} as const;
