import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function OngoingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/organizer/dashboard');
      setEvents(res.data.data?.events || []);
    } catch (error) {
      toast.error('Error loading events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting event');
    }
  };

  const handlePublishEvent = async (eventId) => {
    if (!window.confirm('Publish this event? It will be visible to all participants.')) {
      return;
    }

    try {
      await axios.put(`/api/events/${eventId}/publish`);
      toast.success('Event published successfully!');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  const filteredEvents = events
    .filter((event) => {
      if (filter === 'draft') return event.status === 'Draft';
      if (filter === 'published') return event.status === 'Published';
      return true;
    })
    .filter(
      (event) =>
        (event.eventName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.eventType || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Events</h1>
        <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
          + Create New Event
        </button>
      </div>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search events by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1', minWidth: '250px' }} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}>

              All ({events.length})
            </button>
            <button
              className={`btn ${filter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('draft')}>

              Draft ({events.filter((e) => e.status === 'Draft').length})
            </button>
            <button
              className={`btn ${filter === 'published' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('published')}>

              Published ({events.filter((e) => e.status === 'Published').length})
            </button>
          </div>
        </div>
      </div>

      
      {filteredEvents.length > 0 ?
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredEvents.map((event) =>
        <div key={event._id} className="card" style={{ cursor: 'pointer' }}>
              <div onClick={() => navigate(`/events/${event._id}/manage`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>{event.eventName}</h3>
                  <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: event.status === 'Published' ? '#d4edda' : '#fff3cd',
                color: event.status === 'Published' ? '#155724' : '#856404'
              }}>
                    {event.status}
                  </span>
                </div>
                
                <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
                  {(event.eventDescription || '').length > 100 ? (event.eventDescription || '').substring(0, 100) + '...' : event.eventDescription || ''}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', marginBottom: '15px' }}>
                  <div>
                    <strong>Type:</strong> {event.eventType}
                  </div>
                  <div>
                    <strong>Date:</strong> {event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : '—'}
                  </div>
                  <div>
                    <strong>Registrations:</strong> {event.totalRegistrations || 0}
                    {event.registrationLimit ? `/${event.registrationLimit}` : ''}
                  </div>
                  <div>
                    <strong>Attended:</strong> {event.totalAttendance || 0}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
                <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event._id}/manage`);
              }}>

                  Manage
                </button>
                {event.status === 'Draft' &&
            <>
                    <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/create-event?edit=${event._id}`);
                }}>

                      Edit
                    </button>
                    <button
                className="btn btn-success"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePublishEvent(event._id);
                }}>

                      Publish
                    </button>
                    <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(event._id);
                }}>

                      Delete
                    </button>
                  </>
            }
              </div>
            </div>
        )}
        </div> :

      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Events Found</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            {searchTerm || filter !== 'all' ?
          'Try adjusting your search or filters' :
          'Create your first event to get started!'}
          </p>
          {!searchTerm && filter === 'all' &&
        <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
              Create Event
            </button>
        }
        </div>
      }
    </div>);

}

export default OngoingEvents;
