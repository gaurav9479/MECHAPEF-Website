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
import AdminGallery from './Pages/Admin/AdminGallery';
import Gallery from './Pages/Gallery/Gallery';
import AlbumView from './Pages/Gallery/AlbumView';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<AlbumView />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="EventHead"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute requiredRole="EventHead"><AdminEvents /></ProtectedRoute>
          } />
          <Route path="/admin/team" element={
            <ProtectedRoute requiredRole="EventHead"><AdminTeam /></ProtectedRoute>
          } />
          <Route path="/admin/announcements" element={
            <ProtectedRoute requiredRole="EventHead"><AdminAnnouncements /></ProtectedRoute>
          } />
          <Route path="/admin/sponsors" element={
            <ProtectedRoute requiredRole="EventHead"><AdminSponsors /></ProtectedRoute>
          } />
          <Route path="/admin/management" element={
            <ProtectedRoute requiredRole="EventHead"><AdminManagement /></ProtectedRoute>
          } />
          <Route path="/admin/gallery" element={
            <ProtectedRoute requiredRole="EventHead"><AdminGallery /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
