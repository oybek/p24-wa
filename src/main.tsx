import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Create from './Create.tsx'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <Router basename="/thumbups-webapp">
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/search" element={<App/>} />
      <Route path="/create" element={<Create/>} />
    </Routes>
  </Router>
)
