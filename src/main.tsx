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
    createJwt(WebApp.initData).then(() =>
      listCities().then(({ data }) =>
        setCities(data.map(cityToOption)),
      ),
    );
  }, []);

  return <Create cities={cities} />;
}

createRoot(document.getElementById('root')!).render(
  <Router basename="/fe">
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
