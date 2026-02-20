import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename, headers, rows) => {
  const lines = [];
  lines.push(headers.map(escapeCsv).join(','));
  for (const r of rows) {
    lines.push(r.map(escapeCsv).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function EventManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('participants');

  const fetchEventData = useCallback(async () => {
    try {
      const [eventRes, participantsRes] = await Promise.all([
      axios.get(`/api/events/${eventId}`),
      axios.get(`/api/organizer/events/${eventId}/participants`)]
      );
      setEvent(eventRes.data.event);
      setParticipants(participantsRes.data.participants || []);
    } catch (error) {
      toast.error('Error loading event data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchFeedback = useCallback(async () => {
    try {
      const feedbackRes = await axios.get(`/api/organizer/events/${eventId}/feedback`);
      setFeedback(feedbackRes.data.data?.feedbacks || []);
    } catch (error) {
      toast.error('Error loading feedback');
      console.error(error);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId, filter, fetchEventData]);

  useEffect(() => {
    if (eventId && activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [eventId, activeTab, fetchFeedback]);

  const handleScanQR = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setScanning(true);
    try {
      let scannedTicketId = qrCode.trim();
      if (scannedTicketId.startsWith('{') && scannedTicketId.endsWith('}')) {
        try {
          const parsed = JSON.parse(scannedTicketId);
          if (parsed && typeof parsed === 'object' && parsed.ticketId) {
            scannedTicketId = String(parsed.ticketId);
          }
        } catch (err) {
        }
      }

      const res = await axios.post('/api/organizer/attendance/scan', {
        ticketId: scannedTicketId,
        eventId
      });
      toast.success(res.data.message);
      setQrCode('');
      fetchEventData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error scanning QR code');
    } finally {
      setScanning(false);
    }
  };

  const handlePublishEvent = async () => {
    if (!window.confirm('Are you sure you want to publish this event? It will be visible to all participants.')) {
      return;
    }

    try {
      await axios.put(`/api/events/${eventId}/publish`);
      toast.success('Event published successfully!');
      fetchEventData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      navigate('/ongoing-events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting event');
    }
  };

  if (loading) return <div className="loading">Loading event data...</div>;
  if (!event) return <div className="container"><p>Event not found</p></div>;

  const attendanceRate = participants.length > 0 ?
  (participants.filter((p) => p.attended).length / participants.length * 100).toFixed(1) :
  0;

  const visibleParticipants =
  filter === 'attended' ?
  participants.filter((p) => p.attended) :
  filter === 'notAttended' ?
  participants.filter((p) => !p.attended) :
  participants;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>{event.eventName}</h1>
        <div>
          {event.status === 'Draft' &&
          <button className="btn btn-primary" onClick={handlePublishEvent} style={{ marginRight: '10px' }}>
              Publish Event
            </button>
          }
          <button className="btn btn-secondary" onClick={() => navigate('/ongoing-events')}>
            Back to Events
          </button>
        </div>
      </div>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Event Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <p><strong>Type:</strong> {event.eventType}</p>
            <p><strong>Status:</strong> <span style={{
                color: event.status === 'Published' ? '#28a745' : '#ffc107',
                fontWeight: 'bold'
              }}>{event.status}</span></p>
          </div>
          <div>
            <p><strong>Start:</strong> {event.eventStartDate ? new Date(event.eventStartDate).toLocaleString() : '—'}</p>
            <p><strong>End:</strong> {event.eventEndDate ? new Date(event.eventEndDate).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p><strong>Registrations:</strong> {participants.length}{event.registrationLimit ? ` / ${event.registrationLimit}` : ''}</p>
            <p><strong>Attendance:</strong> {participants.filter((p) => p.attended).length} ({attendanceRate}%)</p>
            <p><strong>Eligibility:</strong> {event.eligibility}</p>
          </div>
        </div>
        {event.status === 'Draft' &&
        <button className="btn btn-danger" onClick={handleDeleteEvent} style={{ marginTop: '15px' }}>
            Delete Event
          </button>
        }
      </div>

      
      <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('participants')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'participants' ? '3px solid #007bff' : 'none',
            fontWeight: activeTab === 'participants' ? 'bold' : 'normal',
            marginRight: '10px'
          }}>

          Participants ({participants.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('feedback');
            if (feedback.length === 0) fetchFeedback();
          }}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'feedback' ? '3px solid #007bff' : 'none',
            fontWeight: activeTab === 'feedback' ? 'bold' : 'normal'
          }}>

          Feedback
        </button>
      </div>

      
      {activeTab === 'participants' &&
      <>
          
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Scan QR Code for Attendance</h2>
            <form onSubmit={handleScanQR} style={{ display: 'flex', gap: '10px' }}>
              <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter ticket ID or paste QR payload"
              style={{ flex: 1 }} />

              <button type="submit" className="btn btn-primary" disabled={scanning}>
                {scanning ? 'Scanning...' : 'Mark Attendance'}
              </button>
            </form>
          </div>

          
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}>

              All ({participants.length})
            </button>
            <button
            className={`btn ${filter === 'attended' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('attended')}>

              Attended ({participants.filter((p) => p.attended).length})
            </button>
            <button
            className={`btn ${filter === 'notAttended' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('notAttended')}>

              Not Attended ({participants.filter((p) => !p.attended).length})
            </button>
          </div>

          
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Participants List</h2>
              <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const headers = ['Name', 'Email', 'Ticket ID', 'Registered At', 'Attendance'];
                const rows = (visibleParticipants || []).map((p) => {
                  const name = p.participantId ? `${p.participantId.firstName || ''} ${p.participantId.lastName || ''}`.trim() : '';
                  return [
                  name,
                  p.participantId?.email || '',
                  p.ticketId || '',
                  p.registrationDate ? new Date(p.registrationDate).toISOString() : '',
                  p.attended ? 'Attended' : 'Not Attended'];

                });
                downloadCsv(`participants_${eventId}.csv`, headers, rows);
              }}>

                Export CSV
              </button>
            </div>
            {visibleParticipants.length > 0 ?
          <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Ticket ID</th>
                      <th>Registered At</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleParticipants.map((participant, index) =>
                <tr key={participant._id}>
                        <td>{index + 1}</td>
                        <td>{participant.participantId ? `${participant.participantId.firstName} ${participant.participantId.lastName}` : '—'}</td>
                        <td>{participant.participantId?.email || '—'}</td>
                        <td><code>{participant.ticketId}</code></td>
                        <td>{participant.registrationDate ? new Date(participant.registrationDate).toLocaleString() : '—'}</td>
                        <td>
                          {participant.attended ?
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Attended</span> :

                    <span style={{ color: '#dc3545' }}>✗ Not Attended</span>
                    }
                        </td>
                      </tr>
                )}
                  </tbody>
                </table>
              </div> :

          <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No participants yet</p>
          }
          </div>
        </>
      }

      
      {activeTab === 'feedback' &&
      <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>Event Feedback</h2>
            <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const headers = ['Rating', 'Comments', 'Submitted At'];
              const rows = (feedback || []).map((f) => [
              f.rating,
              f.comments,
              f.submittedAt ? new Date(f.submittedAt).toISOString() : '']
              );
              downloadCsv(`feedback_${eventId}.csv`, headers, rows);
            }}
            disabled={!feedback || feedback.length === 0}>

              Export CSV
            </button>
          </div>
          {feedback.length > 0 ?
        <div>
              {feedback.map((item, index) =>
          <div key={`${item.submittedAt || index}`} style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            marginBottom: '15px',
            borderLeft: `4px solid ${item.rating >= 4 ? '#28a745' : item.rating >= 3 ? '#ffc107' : '#dc3545'}`
          }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>Participant</strong>
                    <span style={{ color: '#ffc107' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                  </div>
                  <p style={{ margin: '0', color: '#495057' }}>{item.comments}</p>
                  <small style={{ color: '#6c757d' }}>{new Date(item.submittedAt).toLocaleString()}</small>
                </div>
          )}
            </div> :

        <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No feedback yet</p>
        }
        </div>
      }
    </div>);

}

export default EventManagement;
