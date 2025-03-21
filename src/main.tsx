import { createRoot } from 'react-dom/client';
import './index.css';
import Search from './Search.tsx';
import Create from './Create.tsx';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function UserTypeRouter() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userType = queryParams.get('user_type') || 'user';

  if (userType === 'search') {
    return <Search />;
  } else if (userType === 'user') {
    return <Create isAdmin={false} />;
  } else if (userType === 'admin') {
    return <Create isAdmin={true} />;
  } else {
    return <div>404</div>;
  }
}

createRoot(document.getElementById('root')!).render(
  <Router basename="/p24-wa">
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
