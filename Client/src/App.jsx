import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Home from './Pages/Home';
import Login from './Pages/Login/Login';
import Register from './Pages/Register/Register';
import ForgotPassword from './Pages/Login/ForgotPassword';
import ResetPassword from './Pages/Login/ResetPassword';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminEvents from './Pages/Admin/AdminEvents';
import AdminRegistrations from './Pages/Admin/AdminRegistrations';
import AdminTeam from './Pages/Admin/AdminTeam';
import AdminAnnouncements from './Pages/Admin/AdminAnnouncements';
import AdminSponsors from './Pages/Admin/AdminSponsors';
import AdminManagement from './Pages/Admin/AdminManagement';
import AdminGallery from './Pages/Admin/AdminGallery';
import AdminScanner from './Pages/Admin/AdminScanner';
import Gallery from './Pages/Gallery/Gallery';
import AlbumView from './Pages/Gallery/AlbumView';
import Profile from './Pages/Profile/Profile';
import Events from './Pages/Events/Events';
import EventDetails from './Pages/Events/EventDetails';
import Sponsors from './Pages/Sponsors/Sponsors';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';


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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<AlbumView />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/profile" element={
            <ProtectedRoute requiredRole="GeneralUser"><Profile /></ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['PRTeam', 'EventHead', 'SuperAdmin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute requiredRole="EventHead"><AdminEvents /></ProtectedRoute>
          } />
          <Route path="/admin/events/:eventId/registrations" element={
            <ProtectedRoute requiredRole="EventHead"><AdminRegistrations /></ProtectedRoute>
          } />
          <Route path="/admin/team" element={
            <ProtectedRoute requiredRole="EventHead"><AdminTeam /></ProtectedRoute>
          } />
          <Route path="/admin/announcements" element={
            <ProtectedRoute requiredRole="EventHead"><AdminAnnouncements /></ProtectedRoute>
          } />
          <Route path="/admin/sponsors" element={
            <ProtectedRoute 
              allowedRoles={['PRTeam', 'EventHead', 'SuperAdmin']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only PR/Marketing, Event Leads, and Admins can manage Sponsors."
            >
              <AdminSponsors />
            </ProtectedRoute>
          } />
          <Route path="/admin/management" element={
            <ProtectedRoute requiredRole="EventHead"><AdminManagement /></ProtectedRoute>
          } />
          <Route path="/admin/gallery" element={
            <ProtectedRoute 
              allowedRoles={['PRTeam', 'SuperAdmin']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Media/PR Team and Admins can manage the Gallery."
            >
              <AdminGallery />
            </ProtectedRoute>
          } />
          <Route path="/admin/scanner" element={
            <ProtectedRoute requiredRole="EventHead"><AdminScanner /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
