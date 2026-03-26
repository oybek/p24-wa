import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { createJwt, listCities } from './api.ts';
import { CityOption, cityToOption } from './cities.ts';
import { setInitData } from './initData.ts';
import Create from './Create.tsx';
import './index.css';

function UserTypeRouter() {
  const [cities, setCities] = useState<CityOption[]>([]);
  useEffect(() => {
    setInitData(WebApp.initData);
    createJwt(WebApp.initData)
      .then(() => listCities())
      .then(({ data }) => setCities(Array.isArray(data) ? data.map(cityToOption) : []))
      .catch(console.error);
  }, []);

  return <Create cities={cities} />;
}

createRoot(document.getElementById('root')!).render(
  <Router basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
