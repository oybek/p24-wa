import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Create from './Create.tsx'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <Router>
    <Routes>
      <Route path="/thumbups-webapp/search" element={<App/>} />
      <Route path="/thumbups-webapp/create" element={<Create/>} />
    </Routes>
  </Router>
)
