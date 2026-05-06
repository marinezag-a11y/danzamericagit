import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';

import { SupportBar } from './components/SupportBar';

export default function App() {
  return (
    <>
      <SupportBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}
