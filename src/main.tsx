import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Create from './Create.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/thumbups-webapp">
    <Routes>
      <Route path="/search" element={<App/>} />
      <Route path="/create" element={<Create/>} />
    </Routes>
  </BrowserRouter>
)
