import { createRoot } from 'react-dom/client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { createJwt, listCities } from './api.ts';
import { CityOption, cityToOption } from './cities.ts';
import { setInitData } from './initData.ts';
import Create from './Create.tsx';
const Pulse = lazy(() => import('./Pulse.tsx'));
const Search = lazy(() => import('./Search.tsx'));
import './index.css';

const TAB_BAR_HEIGHT = '10vw';

type Tab = 'search' | 'create';

const TABS: readonly Tab[] = ['search', 'create'];
const TAB_LABELS: Record<Tab, string> = {
  search: '🔎 Поиск',
  create: '📢 Создать',
};

const tabBarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  background: 'var(--tg-theme-bg-color)',
  borderBottom: '1px solid var(--tg-theme-secondary-bg-color)',
  zIndex: 200,
};

const tabContentStyle: React.CSSProperties = { paddingTop: TAB_BAR_HEIGHT };

function UserTypeRouter() {
  const [cities, setCities] = useState<CityOption[]>([]);
  const startParam = WebApp.initDataUnsafe.start_param;
  const [tab, setTab] = useState<Tab>(() =>
    startParam === 'trip' || startParam === 'order' ? 'create' : 'search'
  );

  const searchInitialMode = startParam === 'search_order' ? 'order' : 'trip';
  const createInitialMode = startParam === 'order' ? 'order' : 'trip';

  useEffect(() => {
    WebApp.expand();
    WebApp.disableVerticalSwipes();
    setInitData(WebApp.initData);
    if (startParam === 'pulse') return;
    createJwt(WebApp.initData)
      .then(() => { WebApp.requestWriteAccess() })
      .then(() => listCities())
      .then(({ data }) => setCities(Array.isArray(data) ? data.map(cityToOption) : []))
      .catch(console.error);
  }, []);

  if (startParam === 'pulse') return <Suspense fallback={null}><Pulse /></Suspense>;

  return (
    <>
      <div style={{ ...tabContentStyle, display: tab === 'search' ? undefined : 'none' }}>
        <Suspense fallback={null}>
          <Search cities={cities} initialMode={searchInitialMode} />
        </Suspense>
      </div>
      <div style={{ ...tabContentStyle, display: tab === 'create' ? undefined : 'none' }}>
        <Create cities={cities} initialMode={createInitialMode} />
      </div>

      <div style={tabBarStyle}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2vw 0',
              fontSize: '3vw',
              fontFamily: 'inherit',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <Router basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
