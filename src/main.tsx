import { createRoot } from 'react-dom/client';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Create from './Create.tsx';
import './index.css';
import Search from './Search.tsx';
import { toUserType } from './UserType.ts';

function UserTypeRouter() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  if (params.has('search')) {
    return <Search />;
  } else {
    const isAdmin = params.has('admin');
    const userType = toUserType(params.get('user_type')) || 'passenger';
    return <Create isAdmin={isAdmin} userType={userType} />;
  }
}

createRoot(document.getElementById('root')!).render(
  <Router basename="/p24-wa">
    <Routes>
      <Route path="/" element={<UserTypeRouter />} />
    </Routes>
  </Router>,
);
