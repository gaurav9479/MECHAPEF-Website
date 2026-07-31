import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MagazineTransitionProvider } from './context/MagazineTransitionContext';
import './App.css';

import Home from './Pages/Home';
import Login from './Pages/Login/Login';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminEvents from './Pages/Admin/AdminEvents';
import PastEventsManager from './Pages/Admin/PastEventsManager';
import AdminRegistrations from './Pages/Admin/AdminRegistrations';
import AdminTeam from './Pages/Admin/AdminTeam';
import AdminAnnouncements from './Pages/Admin/AdminAnnouncements';
import AdminSponsors from './Pages/Admin/AdminSponsors';
import AdminMagazine from './Pages/Admin/AdminMagazine';
import AdminMail from './Pages/Admin/AdminMail';
import AdminFootprints from './Pages/Admin/AdminFootprints';
import AdminManagement from './Pages/Admin/AdminManagement';
import AdminGallery from './Pages/Admin/AdminGallery';
import AdminScanner from './Pages/Admin/AdminScanner';
import Gallery from './Pages/Gallery/Gallery';
import AlbumView from './Pages/Gallery/AlbumView';
import Profile from './Pages/Profile/Profile';
import Events from './Pages/Events/Events';
import AdminSpecialSponsor from './Pages/Admin/AdminSpecialSponsor';
import AdminMessages from './Pages/Admin/AdminMessages';
import EventDetails from './Pages/Events/EventDetails';
import Sponsors from './Pages/Sponsors/Sponsors';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import MagazineContainer from './Pages/Magazine/MagazineContainer';

const Unauthorized = () => (
  <div
    style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'Orbitron, sans-serif',
      gap: '20px'
    }}
  >
    <h1 style={{ color: '#ff0000', fontSize: '3rem' }}>403</h1>
    <p>Insufficient permissions to access this page.</p>
    <a
      href="/"
      style={{
        color: '#ff0000',
        textDecoration: 'none',
        border: '1px solid #ff0000',
        padding: '10px 24px',
        borderRadius: '8px'
      }}
    >
      ← Back to Home
    </a>
  </div>
);

const AnimatedRoutes = () => {
  return (
    <div
      id="background-routes"
      className="app-transition-container"
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password/:token" element={<Navigate to="/login" replace />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:id" element={<AlbumView />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/sponsors" element={<Sponsors />} />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                'general-user',
                'member',
                'endorsed-volunteer',
                'event-lead',
                'media-lead',
                'super-admin'
              ]}
            >
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super-admin', 'event-lead', 'media-lead', 'endorsed-volunteer']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Content Lead */}
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage Live Events."
            >
              <AdminEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/past-events"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage Past Events."
            >
              <PastEventsManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events/:eventId/registrations"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can view registrations."
            >
              <AdminRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/team"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage the Team."
            >
              <AdminTeam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/mail"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Super Admins can send mail."
            >
              <AdminMail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/footprints"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Super Admins can manage footprints."
            >
              <AdminFootprints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead', 'media-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads, Media Leads, and Super Admins can access Messages."
            >
              <AdminMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/magazine"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage the Magazine."
            >
              <AdminMagazine />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead', 'media-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads, Media Leads, and Super Admins can manage Announcements."
            >
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/management"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'media-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Media Leads and Super Admins can access Management."
            >
              <AdminManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/scanner"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead', 'endorsed-volunteer']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Scanner Volunteers and Event Leads can access Ticket Scanner."
            >
              <AdminScanner />
            </ProtectedRoute>
          }
        />

        {/* Event Lead */}
        <Route
          path="/admin/sponsors"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage Sponsors."
            >
              <AdminSponsors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/special-sponsor"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'event-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Event Leads and Super Admins can manage the Special Sponsor."
            >
              <AdminSpecialSponsor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/gallery"
          element={
            <ProtectedRoute
              allowedRoles={['super-admin', 'media-lead']}
              fallbackPath="/admin"
              toastMessage="Access Denied: Only Media Leads and Super Admins can manage the Gallery."
            >
              <AdminGallery />
            </ProtectedRoute>
          }
        />

      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MagazineTransitionProvider>
        <BrowserRouter>
          <MagazineContainer />
          <AnimatedRoutes />
        </BrowserRouter>
      </MagazineTransitionProvider>
    </AuthProvider>
  );
}

export default App;