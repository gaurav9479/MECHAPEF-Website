import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Home from './Pages/Home';
import Login from './Pages/Login/Login';
import Register from './Pages/Register/Register';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminEvents from './Pages/Admin/AdminEvents';
import AdminTeam from './Pages/Admin/AdminTeam';
import AdminAnnouncements from './Pages/Admin/AdminAnnouncements';
import AdminSponsors from './Pages/Admin/AdminSponsors';
import AdminManagement from './Pages/Admin/AdminManagement';

// Unauthorized page
const Unauthorized = () => (
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontFamily: 'Orbitron, sans-serif', gap: '20px' }}>
    <h1 style={{ color: '#ff0000', fontSize: '3rem' }}>403</h1>
    <p>Insufficient permissions to access this page.</p>
    <a href="/" style={{ color: '#ff0000', textDecoration: 'none', border: '1px solid #ff0000', padding: '10px 24px', borderRadius: '8px' }}>← Back to Home</a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes — JWT protection disabled for now (testing phase) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/team" element={<AdminTeam />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/sponsors" element={<AdminSponsors />} />
          <Route path="/admin/management" element={<AdminManagement />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
