import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const fuzzySubsequence = (needle, haystack) => {
  if (!needle) return true;
  let i = 0;
  let j = 0;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  while (i < n.length && j < h.length) {
    if (n[i] === h[j]) i += 1;
    j += 1;
  }
  return i === n.length;
};

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    eligibility: 'all',
    followedClubs: false,
    startDate: '',
    endDate: ''
  });
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.eventType !== 'all') params.append('eventType', filters.eventType);
      if (filters.eligibility !== 'all') params.append('eligibility', filters.eligibility);
      if (filters.followedClubs) params.append('followedClubs', 'true');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await axios.get(`/api/participant/events?${params.toString()}`);
      setEvents(res.data.data || []);
    } catch (error) {
      toast.error('Error loading events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await axios.get('/api/events/trending');
      setTrending(res.data.events || []);
    } catch (error) {

      console.error('Trending fetch error:', error);
    }
  };

  const filteredEvents = events.filter((event) => {
    const organizerName = event.organizerId?.organizerName || '';
    const haystack = [
    event.eventName,
    event.eventDescription,
    organizerName,
    event.eventType,
    event.eligibility,
    ...(event.eventTags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const needle = searchTerm.toLowerCase();
    return haystack.includes(needle) || fuzzySubsequence(needle, haystack);
  });

  const showTrending = !searchTerm && filters.eventType === 'all' && filters.eligibility === 'all' && !filters.followedClubs && !filters.startDate && !filters.endDate;

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Browse Events</h1>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search events by name, description, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '15px' }} />

        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Event Type</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}>

              <option value="all">All Types</option>
              <option value="Normal">Normal</option>
              <option value="Merchandise">Merchandise</option>
              <option value="Hackathon">Hackathon</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Eligibility</label>
            <select
              value={filters.eligibility}
              onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}>

              <option value="all">All</option>
              <option value="All">All</option>
              <option value="IIIT Only">IIIT Only</option>
              <option value="Non-IIIT Only">Non-IIIT Only</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />

          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />

          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.followedClubs}
                onChange={(e) => setFilters({ ...filters, followedClubs: e.target.checked })} />

              Followed Clubs Only
            </label>
          </div>
        </div>
      </div>

      
      {showTrending && trending.length > 0 &&
      <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>🔥 Trending Events (Top 5 • Last 24h)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {trending.map((event) =>
          <div
            key={event._id}
            className="card"
            style={{ cursor: 'pointer', border: '2px solid #007bff' }}
            onClick={() => navigate(`/events/${event._id}`)}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{event.eventName}</h3>
                  <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                backgroundColor: '#d4edda',
                color: '#155724'
              }}>
                    {event.eventType}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#6c757d', margin: '10px 0' }}>
                  {(event.eventDescription || '').substring(0, 80)}...
                </p>
                <div style={{ fontSize: '13px' }}>
                  <p style={{ margin: '5px 0' }}>📅 {new Date(event.eventStartDate).toLocaleDateString()}</p>
                  <p style={{ margin: '5px 0', color: '#007bff', fontWeight: 'bold' }}>
                    👥 {event.registrationsLast24h != null ? `${event.registrationsLast24h} in last 24h` : `${event.totalRegistrations || 0} registered`}
                  </p>
                  {event.organizerId?.organizerName ?
              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      🏷️ {event.organizerId.organizerName}
                    </p> :
              null}
                </div>
              </div>
          )}
          </div>
        </div>
      }

      
      <h2 style={{ marginBottom: '15px' }}>
        {searchTerm ? 'Search Results' : 'All Events'} ({filteredEvents.length})
      </h2>

      {filteredEvents.length > 0 ?
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredEvents.map((event) =>
        <div
          key={event._id}
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/events/${event._id}`)}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{event.eventName}</h3>
                <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: event.eventType === 'Hackathon' ? '#e7f3ff' : event.eventType === 'Merchandise' ? '#fff3cd' : '#d4edda',
              color: event.eventType === 'Hackathon' ? '#004085' : event.eventType === 'Merchandise' ? '#856404' : '#155724'
            }}>
                  {event.eventType}
                </span>
              </div>

              <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
                {(event.eventDescription || '').length > 120 ?
            (event.eventDescription || '').substring(0, 120) + '...' :
            event.eventDescription || ''}
              </p>

              <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                <p style={{ margin: '5px 0' }}><strong>Date:</strong> {new Date(event.eventStartDate).toLocaleDateString()}</p>
                <p style={{ margin: '5px 0' }}><strong>Eligibility:</strong> {event.eligibility}</p>
                {event.organizerId?.organizerName ?
            <p style={{ margin: '5px 0' }}><strong>Organizer:</strong> {event.organizerId.organizerName}</p> :
            null}
                <p style={{ margin: '5px 0' }}><strong>Registrations:</strong> {event.totalRegistrations || 0}{event.registrationLimit ? ` / ${event.registrationLimit}` : ''}</p>
                {event.eventType === 'Merchandise' &&
            <p style={{ margin: '5px 0' }}><strong>Fee:</strong> ₹{event.registrationFee || 0}</p>
            }
                {event.eventTags?.length ?
            <p style={{ margin: '5px 0' }}><strong>Tags:</strong> {event.eventTags.join(', ')}</p> :
            null}
              </div>

              <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${event._id}`);
            }}>

                View Details
              </button>
            </div>
        )}
        </div> :

      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Events Found</h3>
          <p style={{ color: '#6c757d' }}>
            {searchTerm ? 'Try adjusting your search or filters' : 'No events available at the moment'}
          </p>
        </div>
      }
    </div>);

}

export default BrowseEvents;
