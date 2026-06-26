import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import Home from './Pages/Home';
import Login from './Pages/Login/Login';
import Register from './Pages/Register/Register';
import ForgotPassword from './Pages/Login/ForgotPassword';
import ResetPassword from './Pages/Login/ResetPassword';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminEvents from './Pages/Admin/AdminEvents';
import PastEventsManager from './Pages/Admin/PastEventsManager';
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

const AnimatedRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [adminFade, setAdminFade] = useState(false);

  // If starting on an admin page, skip opening animation entirely
  const isAdminRoute = (path) => path.startsWith('/admin');
  const [transitionStage, setTransitionStage] = useState(
    isAdminRoute(location.pathname) ? "idle" : "opening"
  );

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname || location.search !== displayLocation.search) {
      const fromAdmin = isAdminRoute(displayLocation.pathname);
      const toAdmin = isAdminRoute(location.pathname);

      if (fromAdmin || toAdmin) {
        // Admin routes: simple instant swap, no shutter
        setAdminFade(true);
        setTimeout(() => {
          setDisplayLocation(location);
          window.scrollTo(0, 0);
          setAdminFade(false);
        }, 150);
      } else {
        // Public routes: full mechanical shutter
        setTransitionStage("closing");
      }
    }
  }, [location, displayLocation]);

  const handleCloseComplete = () => {
    setDisplayLocation(location);
    window.scrollTo(0, 0);
    setTransitionStage("opening");
  };

  const handleOpenComplete = () => {
    setTransitionStage("idle");
  };

  return (
    <div className="app-transition-container" style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Admin fade overlay — shown only for admin navigation */}
      {adminFade && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: '#0a0a0a',
          opacity: adminFade ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none'
        }} />
      )}

      {/* Route Contents */}
      <div style={{ opacity: adminFade ? 0 : 1, transition: 'opacity 0.15s ease' }}>
        <Routes location={displayLocation}>
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
          <Route path="/admin/past-events" element={
            <ProtectedRoute requiredRole="EventHead"><PastEventsManager /></ProtectedRoute>
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
      </div>

      {/* Mechanical Shutter — never shown on admin routes */}
      {!isAdminRoute(displayLocation.pathname) && (
        <>
          <motion.div
            className="mech-shutter mech-shutter-top"
            initial={{ y: "0vh" }}
            animate={{ y: transitionStage === "closing" ? "0vh" : "-50vh" }}
            onAnimationComplete={() => {
              if (transitionStage === "closing") handleCloseComplete();
              else if (transitionStage === "opening") handleOpenComplete();
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ top: 0 }}
          >
            <div className="shutter-inner" style={{
              background: "repeating-linear-gradient(45deg, #050505, #050505 15px, #ff1f01 15px, #ff1f01 30px)",
              width: "100%", height: "20px", position: "absolute", bottom: 0
            }} />
          </motion.div>

          <motion.div
            className="mech-shutter mech-shutter-bottom"
            initial={{ y: "0vh" }}
            animate={{ y: transitionStage === "closing" ? "0vh" : "50vh" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ bottom: 0 }}
          >
            <div className="shutter-inner" style={{
              background: "repeating-linear-gradient(45deg, #050505, #050505 15px, #ff1f01 15px, #ff1f01 30px)",
              width: "100%", height: "20px", position: "absolute", top: 0
            }} />
          </motion.div>
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
