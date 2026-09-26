import { useState } from 'react';
import { useColorScheme } from 'twenty-sdk/front-component';

import { greetingForHour } from 'src/domain/presentation';
import { selectOpenItems } from 'src/domain/shopping';
import { ariaBool } from 'src/ui/components';
import { ActivityScreen } from 'src/ui/screens/activity-screen';
import { ListScreen } from 'src/ui/screens/list-screen';
import { NowScreen } from 'src/ui/screens/now-screen';
import type { Tab } from 'src/ui/screens/now-screen';
import { ProductsScreen } from 'src/ui/screens/products-screen';
import { APP_STYLES } from 'src/ui/styles';
import { useHousehold } from 'src/ui/use-household';

const TABS: { id: Tab; label: string }[] = [
  { id: 'now', label: 'Now' },
  { id: 'list', label: 'List' },
  { id: 'products', label: 'Products' },
  { id: 'activity', label: 'Activity' },
];

export const EverydayApp = () => {
  const colorScheme = useColorScheme();
  const household = useHousehold();
  const [tab, setTab] = useState<Tab>('now');
  const { loadState, loadError, now, snapshot, announcement } = household;
  const openCount = selectOpenItems(snapshot?.shoppingItems ?? []).length;

  const navigate = (next: Tab) => {
    setTab(next);
    // Re-read on navigation so the screen shows other household members' changes.
    household.reload();
  };

  return (
    <div className="er-app" data-theme={colorScheme}>
      <style>{APP_STYLES}</style>
      <header className="er-header">
        <div className="er-header-inner">
          <h1 className="er-greeting">{greetingForHour(now.getHours())}</h1>
          <p className="er-date">
            {now.toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </header>
      <nav className="er-nav" aria-label="Sections">
        <div className="er-nav-inner">
          <div className="er-tabs" role="tablist">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`er-tab-${entry.id}`}
                aria-selected={ariaBool(tab === entry.id)}
                aria-controls="er-panel"
                className={`er-tab${tab === entry.id ? ' er-tab-active' : ''}`}
                onClick={() => navigate(entry.id)}
              >
                {entry.label}
                {entry.id === 'list' && openCount > 0 && (
                  <span className="er-tab-count" aria-label={`${openCount} open`}>
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {/* Keyed by tab so each tab starts scrolled to the top: setting
          scrollTop is a no-op inside Twenty's front component sandbox. */}
      <main className="er-main er-scroll" key={tab}>
        <div className="er-content" id="er-panel" role="tabpanel" aria-labelledby={`er-tab-${tab}`}>
          <div className="er-visually-hidden" aria-live="polite">
            {announcement}
          </div>
          {loadState === 'loading' && <div className="er-loading">Loading your household…</div>}
          {loadState === 'error' && (
            <div className="er-stack">
              <div className="er-banner" role="alert">
                Could not load your household: {loadError}
              </div>
              <button type="button" className="er-btn" onClick={() => household.reload()}>
                Try again
              </button>
            </div>
          )}
          {loadState === 'ready' && tab === 'now' && (
            <NowScreen household={household} onNavigate={navigate} />
          )}
          {loadState === 'ready' && tab === 'list' && <ListScreen household={household} />}
          {loadState === 'ready' && tab === 'products' && <ProductsScreen household={household} />}
          {loadState === 'ready' && tab === 'activity' && <ActivityScreen household={household} />}
        </div>
      </main>
    </div>
  );
};
