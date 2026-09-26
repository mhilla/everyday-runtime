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
  SHOPPING_ITEM_FIELD_IDS,
  SHOPPING_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SHOPPING_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'shoppingItem',
  namePlural: 'shoppingItems',
  labelSingular: 'Shopping item',
  labelPlural: 'Shopping items',
  description:
    'An entry on the shopping list — added by a person or suggested by the engine.',
  icon: 'IconShoppingCart',
  labelIdentifierFieldMetadataUniversalIdentifier: SHOPPING_ITEM_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.product,
      type: FieldType.RELATION,
      name: 'product',
      label: 'Product',
      icon: 'IconBasket',
      relationTargetObjectMetadataUniversalIdentifier:
        PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        PRODUCT_FIELD_IDS.shoppingItems,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'productId',
      },
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.requestedQuantity,
      type: FieldType.NUMBER,
      name: 'requestedQuantity',
      label: 'Requested quantity',
      icon: 'IconNumbers',
      defaultValue: 1,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.status,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: `'OPEN'`,
      options: [
        { id: 'be5e0ec4-8a0d-4f5d-8d02-90a0e5659021', value: 'OPEN', label: 'Open', position: 0, color: 'blue' },
        { id: 'eeadc986-ba6a-4bc3-a69e-ca654b9d4e51', value: 'PURCHASED', label: 'Purchased', position: 1, color: 'green' },
        { id: '995bf746-79be-4ba8-aed1-609ce5f67afe', value: 'DISMISSED', label: 'Dismissed', position: 2, color: 'gray' },
      ],
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.origin,
      type: FieldType.SELECT,
      name: 'origin',
      label: 'Origin',
      icon: 'IconSparkles',
      defaultValue: `'MANUAL'`,
      options: [
        { id: '4beea837-63f4-491c-a80d-07d3ee792d2d', value: 'MANUAL', label: 'Added by you', position: 0, color: 'blue' },
        { id: 'b365bf20-3cee-4550-b70a-54e984bcee58', value: 'INFERRED', label: 'Suggested', position: 1, color: 'purple' },
      ],
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.confidence,
      type: FieldType.NUMBER,
      name: 'confidence',
      label: 'Confidence',
      description: 'Need score (0–1) at the time the suggestion was accepted.',
      icon: 'IconGauge',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.explanation,
      type: FieldType.TEXT,
      name: 'explanation',
      label: 'Explanation',
      icon: 'IconInfoCircle',
      isNullable: true,
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.purchasedAt,
      type: FieldType.DATE_TIME,
      name: 'purchasedAt',
      label: 'Purchased at',
      icon: 'IconCheck',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: SHOPPING_ITEM_FIELD_IDS.dismissedAt,
      type: FieldType.DATE_TIME,
      name: 'dismissedAt',
      label: 'Dismissed at',
      icon: 'IconX',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
