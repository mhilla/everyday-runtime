import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  OBSERVATION_FIELD_IDS,
  OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCT_FIELD_IDS,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: OBSERVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'observation',
  namePlural: 'observations',
  labelSingular: 'Observation',
  labelPlural: 'Observations',
  description:
    'A single piece of evidence about a product: bought, used, empty, still there, or needed.',
  icon: 'IconEye',
  labelIdentifierFieldMetadataUniversalIdentifier: OBSERVATION_FIELD_IDS.summary,
  fields: [
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.summary,
      type: FieldType.TEXT,
      name: 'summary',
      label: 'Summary',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.product,
      type: FieldType.RELATION,
      name: 'product',
      label: 'Product',
      icon: 'IconBasket',
      relationTargetObjectMetadataUniversalIdentifier:
        PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        PRODUCT_FIELD_IDS.observations,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'productId',
      },
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.type,
      type: FieldType.SELECT,
      name: 'observationType',
      label: 'Type',
      icon: 'IconTag',
      defaultValue: `'SEEN_IN_STOCK'`,
      options: [
        { id: '8ec4b8f7-0483-4731-8b65-4a5283d5c431', value: 'PURCHASED', label: 'Purchased', position: 0, color: 'green' },
        { id: '5d53b3f0-2261-425c-ba68-f954f6b8faf5', value: 'CONSUMED', label: 'Consumed', position: 1, color: 'amber' },
        { id: '298fbabb-2b31-4bb7-9745-9e78e9703455', value: 'EMPTY', label: 'Empty', position: 2, color: 'red' },
        { id: 'b7e0d332-214d-4199-8e0e-28e5b94ba5a4', value: 'SEEN_IN_STOCK', label: 'Seen in stock', position: 3, color: 'sky' },
        { id: 'b0a8df3e-9644-4505-ae9f-1ef1dd34ea45', value: 'MANUAL_NEED', label: 'Needed', position: 4, color: 'violet' },
      ],
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.quantity,
      type: FieldType.NUMBER,
      name: 'quantity',
      label: 'Quantity',
      icon: 'IconNumbers',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.observedAt,
      type: FieldType.DATE_TIME,
      name: 'observedAt',
      label: 'Observed at',
      icon: 'IconClock',
      defaultValue: 'now',
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.source,
      type: FieldType.SELECT,
      name: 'source',
      label: 'Source',
      icon: 'IconPlug',
      isNullable: true,
      defaultValue: `'APP'`,
      options: [
        { id: 'f7268bd1-6aa5-4929-ac55-e9a2d1cce0d2', value: 'APP', label: 'App', position: 0, color: 'blue' },
        { id: '66c5aba8-8e7f-4803-98f3-f620ccace70f', value: 'SHOPPING_LIST', label: 'Shopping list', position: 1, color: 'green' },
        { id: 'b2b2ca79-7a91-4936-aeec-ca03001e6db2', value: 'DEMO', label: 'Demo data', position: 2, color: 'gray' },
        { id: '88236523-2693-437f-959a-a70f801e1c85', value: 'IMPORT', label: 'Import', position: 3, color: 'purple' },
        { id: '15eda4f4-8245-4b00-9f8d-b91d6efd5f18', value: 'API', label: 'API', position: 4, color: 'turquoise' },
      ],
    },
    {
      universalIdentifier: OBSERVATION_FIELD_IDS.note,
      type: FieldType.TEXT,
      name: 'note',
      label: 'Note',
      icon: 'IconNote',
      isNullable: true,
    },
  ],
});
