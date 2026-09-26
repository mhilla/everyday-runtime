import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PRODUCT_FIELD_IDS,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  PURCHASE_FIELD_IDS,
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'purchase',
  namePlural: 'purchases',
  labelSingular: 'Purchase',
  labelPlural: 'Purchases',
  description: 'A product that was actually bought, with optional price and store.',
  icon: 'IconReceipt',
  labelIdentifierFieldMetadataUniversalIdentifier: PURCHASE_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: PURCHASE_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PURCHASE_FIELD_IDS.product,
      type: FieldType.RELATION,
      name: 'product',
      label: 'Product',
      icon: 'IconBasket',
      relationTargetObjectMetadataUniversalIdentifier:
        PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier: PRODUCT_FIELD_IDS.purchases,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'productId',
      },
    },
    {
      universalIdentifier: PURCHASE_FIELD_IDS.quantity,
      type: FieldType.NUMBER,
      name: 'quantity',
      label: 'Quantity',
      icon: 'IconNumbers',
      defaultValue: 1,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: PURCHASE_FIELD_IDS.purchasedAt,
      type: FieldType.DATE_TIME,
      name: 'purchasedAt',
      label: 'Purchased at',
      icon: 'IconCalendar',
      defaultValue: 'now',
    },
    {
      universalIdentifier: PURCHASE_FIELD_IDS.price,
      type: FieldType.CURRENCY,
      name: 'price',
      label: 'Price',
      icon: 'IconCurrencyEuro',
      isNullable: true,
    },
    {
      universalIdentifier: PURCHASE_FIELD_IDS.store,
      type: FieldType.TEXT,
      name: 'store',
      label: 'Store',
      icon: 'IconBuildingStore',
      isNullable: true,
    },
  ],
});
