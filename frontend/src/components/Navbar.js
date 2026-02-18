import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  const getNavLinks = () => {
    switch (user.role) {
      case 'participant':
        return (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/events">Browse Events</Link>
            <Link to="/organizers">Clubs/Organizers</Link>
            <Link to="/profile">Profile</Link>
          </>);

      case 'organizer':
        return (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/create-event">Create Event</Link>
            <Link to="/ongoing-events">Ongoing Events</Link>
            <Link to="/profile">Profile</Link>
          </>);

      case 'admin':
        return (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/manage-organizers">Manage Clubs/Organizers</Link>
            <Link to="/password-resets">Password Reset Requests</Link>
          </>);

      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div>
        <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold' }}>
          Felicity Event Management
        </Link>
      </div>
      <div>
        {getNavLinks()}
        <button onClick={logout} className="btn btn-secondary" style={{ marginLeft: '20px' }}>
          Logout
        </button>
      </div>
    </nav>);

}

export default Navbar;
