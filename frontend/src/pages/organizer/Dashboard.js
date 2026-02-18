import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/organizer/dashboard');
      setEvents(res.data.data?.events || []);
      setStats(res.data.data?.analytics || null);
    } catch (error) {
      toast.error('Error loading dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevEvent = () => {
    setCurrentEventIndex((prev) => prev > 0 ? prev - 1 : events.length - 1);
  };

  const handleNextEvent = () => {
    setCurrentEventIndex((prev) => prev < events.length - 1 ? prev + 1 : 0);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const currentEvent = events[currentEventIndex];

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Organizer Dashboard</h1>

      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats?.totalEvents || 0}</h3>
          <p>Total Events</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.completedEvents || 0}</h3>
          <p>Completed Events</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.totalRegistrations || 0}</h3>
          <p>Total Registrations</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats?.totalRevenue || 0}</h3>
          <p>Total Revenue</p>
        </div>
      </div>

      
      {events.length > 0 ?
      <div className="card" style={{ marginTop: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>My Events</h2>
          <div style={{ position: 'relative' }}>
            <div className="event-carousel">
              <div className="carousel-content">
                <h3>{currentEvent.eventName}</h3>
                <p><strong>Type:</strong> {currentEvent.eventType}</p>
                <p><strong>Status:</strong> <span style={{
                  color: currentEvent.status === 'Published' ? '#28a745' : '#ffc107',
                  fontWeight: 'bold'
                }}>{currentEvent.status}</span></p>
                <p><strong>Date:</strong> {new Date(currentEvent.eventStartDate).toLocaleDateString()}</p>
                <p><strong>Registrations:</strong> {currentEvent.totalRegistrations || 0}</p>
                <p><strong>Capacity:</strong> {currentEvent.totalRegistrations || 0}/{currentEvent.registrationLimit || '—'}</p>
                <div style={{ marginTop: '15px' }}>
                  <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/events/${currentEvent._id}/manage`)}
                  style={{ marginRight: '10px' }}>

                    Manage Event
                  </button>
                  {currentEvent.status === 'Draft' &&
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/create-event?edit=${currentEvent._id}`)}>

                      Edit Event
                    </button>
                }
                </div>
              </div>
            </div>
            {events.length > 1 &&
          <div className="carousel-controls">
                <button onClick={handlePrevEvent} className="carousel-btn">‹</button>
                <span>{currentEventIndex + 1} / {events.length}</span>
                <button onClick={handleNextEvent} className="carousel-btn">›</button>
              </div>
          }
          </div>
        </div> :

      <div className="card" style={{ marginTop: '30px', textAlign: 'center', padding: '40px' }}>
          <h3>No Events Yet</h3>
          <p>Create your first event to get started!</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
            Create Event
          </button>
        </div>
      }

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>Quick Actions</h2>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/create-event')}>

            Create New Event
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => navigate('/ongoing-events')}>

            View All Events
          </button>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>Recent Activity</h2>
          <p style={{ color: '#6c757d' }}>
            Open an event to view registrations, attendance, and feedback.
          </p>
        </div>
      </div>
    </div>);

}

export default Dashboard;
