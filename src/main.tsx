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

function UserTypeRouter() {
  const [cities, setCities] = useState<CityOption[]>([]);
  const startParam = WebApp.initDataUnsafe.start_param;

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
  if (startParam === 'search_order' || startParam === 'search_trip') {
    return <Suspense fallback={null}><Search cities={cities} initialMode={startParam === 'search_trip' ? 'trip' : 'order'} /></Suspense>;
  }

  return <Create cities={cities} initialMode={startParam === 'trip' ? 'trip' : 'order'} />;
}

createRoot(document.getElementById('root')!).render(
  <Router basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
