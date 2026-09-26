import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutWidgetVerticalListHeightBehavior,
} from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MAIN_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One full-height widget hosts the whole consumer UI (Now, Shopping list,
// Products, Activity). Widget order in a VERTICAL_LIST tab is the order of the
// `widgets` array; `position` is deprecated since twenty-sdk 2.42.
export default definePageLayout({
  universalIdentifier: MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: APP_DISPLAY_NAME,
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Home',
      position: 0,
      icon: 'IconShoppingCart',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: MAIN_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Everyday Runtime',
          type: 'FRONT_COMPONENT',
          heightBehavior: PageLayoutWidgetVerticalListHeightBehavior.TAB_VIEWPORT,
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
