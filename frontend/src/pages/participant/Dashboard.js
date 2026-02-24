import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const isPast = (event) => {
  if (!event?.eventEndDate) return false;
  return new Date(event.eventEndDate) < new Date();
};

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Normal');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/participant/dashboard');
      setDashboard(res.data.data);
    } catch (error) {
      console.error('Dashboard error:', error.response || error);
      toast.error(error.response?.data?.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const upcomingRegs = dashboard?.registrations?.filter((reg) =>
  reg.event && new Date(reg.event.eventStartDate) > new Date()
  ) || [];

  const completedRegs = dashboard?.registrations?.filter((reg) =>
  reg.event && new Date(reg.event.eventEndDate) < new Date()
  ) || [];

  const allRegs = dashboard?.registrations || [];
  const historyRegs = allRegs.filter((r) => r.event);

  const tabDefs = [
  { key: 'Normal', label: 'Normal' },
  { key: 'Merchandise', label: 'Merchandise' },
  { key: 'Completed', label: 'Completed' },
  { key: 'CancelledRejected', label: 'Cancelled/Rejected' }];


  const tabbedRegs = historyRegs.filter((reg) => {
    const type = reg.registrationType || reg.event?.eventType;
    const status = reg.status;

    if (activeTab === 'Normal') return type === 'Normal';
    if (activeTab === 'Merchandise') return type === 'Merchandise';
    if (activeTab === 'Completed') return isPast(reg.event) || status === 'Completed';
    if (activeTab === 'CancelledRejected') return status === 'Cancelled' || status === 'Rejected';
    return true;
  });

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>My Events Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{dashboard?.upcomingEvents || 0}</h3>
          <p>Upcoming Registered Events</p>
        </div>
        <div className="stat-card">
          <h3>{dashboard?.completedEvents || 0}</h3>
          <p>Completed Events</p>
        </div>
        <div className="stat-card">
          <h3>{dashboard?.totalRegistrations || 0}</h3>
          <p>Total Registrations</p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '6px' }}>Upcoming Registered Events</h2>
        <p style={{ marginTop: 0, marginBottom: '20px', color: '#6c757d' }}>
          Shows events you have registered/purchased tickets for.
        </p>
        {upcomingRegs.length > 0 ?
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {upcomingRegs.map((reg) =>
          <div
            key={reg._id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/events/${reg.event._id}`)}>

                <h3>{reg.event.eventName}</h3>
                <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                  {reg.event.eventDescription?.substring(0, 100)}...
                </p>
                <p><strong>Organizer:</strong> {reg.organizer?.organizerName || reg.event?.organizerId?.organizerName || '—'}</p>
                <p><strong>Type:</strong> {reg.event.eventType}</p>
                <p><strong>Date:</strong> {new Date(reg.event.eventStartDate).toLocaleDateString()}</p>
                <p>
                  <strong>Ticket ID:</strong>{' '}
                  <code style={{ cursor: 'pointer' }} onClick={(e) => {
                e.stopPropagation();
                navigate(`/ticket/${reg.ticketId}`);
              }}>
                    {reg.ticketId}
                  </code>
                </p>
                <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/ticket/${reg.ticketId}`);
              }}
              style={{ marginTop: '10px' }}>

                  View QR / Ticket
                </button>
                {reg.attended &&
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '12px',
              fontSize: '12px',
              marginTop: '10px'
            }}>
                    ✓ Attended
                  </span>
            }
              </div>
          )}
          </div> :

        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6c757d' }}>No upcoming registered events</p>
            <button
            className="btn btn-primary"
            onClick={() => navigate('/events')}
            style={{ marginTop: '15px' }}>

              Browse Events
            </button>
          </div>
        }
      </div>

      {completedRegs.length > 0 &&
      <div style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Completed Events</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {completedRegs.map((reg) =>
          <div
            key={reg._id}
            className="card"
            style={{ cursor: 'pointer', opacity: 0.8 }}
            onClick={() => navigate(`/events/${reg.event._id}`)}>

                <h3>{reg.event.eventName}</h3>
                <p><strong>Type:</strong> {reg.event.eventType}</p>
                <p><strong>Date:</strong> {new Date(reg.event.eventStartDate).toLocaleDateString()}</p>
                {reg.attended ?
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Attended</span> :

            <span style={{ color: '#dc3545' }}>✗ Not Attended</span>
            }
              </div>
          )}
          </div>
        </div>
      }

      
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '10px' }}>Participation History</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {tabDefs.map((t) =>
          <button
            key={t.key}
            className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(t.key)}
            type="button">

              {t.label}
            </button>
          )}
        </div>

        {tabbedRegs.length > 0 ?
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
            {tabbedRegs.map((reg) => {
            const organizerName = reg.organizer?.organizerName || reg.event?.organizerId?.organizerName;
            return (
              <div
                key={reg._id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => reg.event?._id && navigate(`/events/${reg.event._id}`)}>

                  <h3 style={{ marginTop: 0 }}>{reg.event?.eventName}</h3>
                  <p style={{ margin: '6px 0' }}><strong>Type:</strong> {reg.registrationType || reg.event?.eventType}</p>
                  <p style={{ margin: '6px 0' }}><strong>Organizer:</strong> {organizerName || '—'}</p>
                  <p style={{ margin: '6px 0' }}><strong>Status:</strong> {reg.status || 'Approved'}</p>
                  {reg.team?.teamName &&
                <p style={{ margin: '6px 0' }}><strong>Team:</strong> {reg.team.teamName}</p>
                }

                  <p style={{ margin: '6px 0' }}>
                    <strong>Ticket ID:</strong>{' '}
                    {reg.ticketId ?
                  <code style={{ cursor: 'pointer' }} onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ticket/${reg.ticketId}`);
                  }}>
                        {reg.ticketId}
                      </code> :

                  '—'
                  }
                  </p>
                  <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reg.ticketId) navigate(`/ticket/${reg.ticketId}`);
                  }}
                  disabled={!reg.ticketId}
                  style={{ marginTop: '10px' }}>

                    View QR / Ticket
                  </button>
                </div>);

          })}
          </div> :

        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <p style={{ color: '#6c757d' }}>No records in this tab.</p>
          </div>
        }
      </div>
    </div>);

}

export default Dashboard;
