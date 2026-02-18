import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

function OrganizerDetails() {
  const { organizerId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/participant/organizers/${organizerId}`);
      setOrganizer(res.data.organizer);
      setUpcomingEvents(res.data.upcomingEvents || []);
      setPastEvents(res.data.pastEvents || []);
      setIsFollowing(!!res.data.isFollowing);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading organizer');
    } finally {
      setLoading(false);
    }
  }, [organizerId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const toggleFollow = async () => {
    if (!organizer?._id) return;
    setToggling(true);
    try {
      if (isFollowing) {
        await axios.post(`/api/participant/organizers/${organizer._id}/unfollow`);
        toast.success('Unfollowed organizer');
        setIsFollowing(false);
      } else {
        await axios.post(`/api/participant/organizers/${organizer._id}/follow`);
        toast.success('Following organizer');
        setIsFollowing(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating follow status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="loading">Loading organizer...</div>;
  if (!organizer) return <div className="container"><p>Organizer not found</p></div>;

  const renderEventCard = (e) =>
  <div
    key={e._id}
    className="card"
    style={{ cursor: 'pointer' }}
    onClick={() => navigate(`/events/${e._id}`)}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>{e.eventName}</h3>
        <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: '#e7f3ff',
        color: '#004085'
      }}>
          {e.eventType}
        </span>
      </div>
      <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
        {e.eventStartDate ? new Date(e.eventStartDate).toLocaleDateString() : '—'}
        {' '}→{' '}
        {e.eventEndDate ? new Date(e.eventEndDate).toLocaleDateString() : '—'}
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
        <strong>Status:</strong> {e.status}
      </p>
    </div>;


  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '6px' }}>{organizer.organizerName}</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: '#f1f3f5'
            }}>
              {organizer.category || '—'}
            </span>
            <span style={{ color: '#6c757d', fontSize: '14px' }}>{organizer.contactEmail || '—'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/organizers')}>
            Back
          </button>
          <button
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleFollow}
            disabled={toggling}>

            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        </div>
      </div>

      {organizer.description ?
      <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '10px' }}>About</h2>
          <p style={{ margin: 0, color: '#495057', lineHeight: 1.6 }}>{organizer.description}</p>
        </div> :
      null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>Upcoming Events</h2>
          {upcomingEvents.length > 0 ?
          <div style={{ display: 'grid', gap: '12px' }}>
              {upcomingEvents.map(renderEventCard)}
            </div> :

          <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>No upcoming events</div>
          }
        </div>

        <div>
          <h2 style={{ marginBottom: '10px' }}>Past Events</h2>
          {pastEvents.length > 0 ?
          <div style={{ display: 'grid', gap: '12px' }}>
              {pastEvents.map(renderEventCard)}
            </div> :

          <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>No past events</div>
          }
        </div>
      </div>
    </div>);

}

export default OrganizerDetails;
