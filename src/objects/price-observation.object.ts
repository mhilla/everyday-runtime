import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PRICE_OBSERVATION_FIELD_IDS,
  PRICE_OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCT_FIELD_IDS,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: PRICE_OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'priceObservation',
  namePlural: 'priceObservations',
  labelSingular: 'Price observation',
  labelPlural: 'Price observations',
  description:
    'A price seen for a product — in a store, a flyer, a receipt or open community data.',
  icon: 'IconTag',
  labelIdentifierFieldMetadataUniversalIdentifier: PRICE_OBSERVATION_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.product,
      type: FieldType.RELATION,
      name: 'product',
      label: 'Product',
      icon: 'IconBasket',
      relationTargetObjectMetadataUniversalIdentifier: PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier: PRODUCT_FIELD_IDS.priceObservations,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'productId',
      },
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.price,
      type: FieldType.CURRENCY,
      name: 'price',
      label: 'Price',
      icon: 'IconCurrencyEuro',
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.packQuantity,
      type: FieldType.NUMBER,
      name: 'packQuantity',
      label: 'Pack size',
      description: "Quantity in the product's unit that the price is for (e.g. 6 for a crate of 6 × 1 l).",
      icon: 'IconNumbers',
      defaultValue: 1,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 3 },
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.store,
      type: FieldType.TEXT,
      name: 'store',
      label: 'Store',
      icon: 'IconBuildingStore',
      isNullable: true,
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.observedAt,
      type: FieldType.DATE_TIME,
      name: 'observedAt',
      label: 'Observed at',
      icon: 'IconClock',
      defaultValue: 'now',
    },
    {
      universalIdentifier: PRICE_OBSERVATION_FIELD_IDS.source,
      type: FieldType.SELECT,
      name: 'source',
      label: 'Source',
      icon: 'IconPlug',
      defaultValue: `'MANUAL'`,
      options: [
        { id: 'ae8b651a-4ce0-4224-ad89-1eb5e2c2223c', value: 'MANUAL', label: 'Entered by you', position: 0, color: 'blue' },
        { id: 'acb7d146-2ce2-49fd-8497-49d71a51e28b', value: 'RECEIPT', label: 'Receipt', position: 1, color: 'green' },
        { id: '82353fdb-14c7-4dac-83a7-1facc1827baf', value: 'OPEN_PRICES', label: 'Open Prices (community)', position: 2, color: 'purple' },
      ],
    },
  ],
});
