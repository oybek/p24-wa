import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Create from './Create.tsx';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function UserTypeRouter() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userType = queryParams.get('user_type');

  if (userType === 'driver') {
    return <App />;
  } else if (userType === 'user') {
    return <Create />;
  } else {
    return <div>404</div>;
  }
}

createRoot(document.getElementById('root')!).render(
  <Router basename="/thumbups-webapp">
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
