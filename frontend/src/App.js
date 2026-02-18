import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import { AuthProvider, useAuth } from './context/AuthContext';


import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Ticket from './pages/participant/Ticket';
import ParticipantProfile from './pages/participant/Profile';
import Organizers from './pages/participant/Organizers';
import OrganizerDetails from './pages/participant/OrganizerDetails';

import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import OrganizerProfile from './pages/organizer/Profile';
import EventManagement from './pages/organizer/EventManagement';
import OngoingEvents from './pages/organizer/OngoingEvents';

import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';


import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>);

}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        
        <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardRoute(user.role)} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={getDashboardRoute(user.role)} />} />

        
        {user && user.role === 'participant' &&
        <>
            <Route path="/dashboard" element={<ParticipantDashboard />} />
            <Route path="/events" element={<BrowseEvents />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/ticket/:ticketId" element={<Ticket />} />
            
            <Route path="/participant/browse" element={<BrowseEvents />} />
            <Route path="/participant/event/:eventId" element={<EventDetails />} />
            <Route path="/participant/ticket/:ticketId" element={<Ticket />} />
            <Route path="/profile" element={<ParticipantProfile />} />
            <Route path="/organizers" element={<Organizers />} />
            <Route path="/organizers/:organizerId" element={<OrganizerDetails />} />
          </>
        }

        
        {user && user.role === 'organizer' &&
        <>
            <Route path="/dashboard" element={<OrganizerDashboard />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/events/:eventId/manage" element={<EventManagement />} />
            <Route path="/ongoing-events" element={<OngoingEvents />} />
            <Route path="/profile" element={<OrganizerProfile />} />
          </>
        }

        
        {user && user.role === 'admin' &&
        <>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/manage-organizers" element={<ManageOrganizers />} />
            <Route path="/password-resets" element={<PasswordResetRequests />} />
          </>
        }

        
        <Route path="/" element={user ? <Navigate to={getDashboardRoute(user.role)} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>);

}

function getDashboardRoute(role) {
  return '/dashboard';
}

export default App;
