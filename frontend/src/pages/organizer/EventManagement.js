import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';

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
  const [cameraActive, setCameraActive] = useState(false);
  const [overrideModal, setOverrideModal] = useState({ show: false, registrationId: null, name: '', attended: false });
  const [overrideReason, setOverrideReason] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [forumMessages, setForumMessages] = useState([]);
  const [forumNewMsg, setForumNewMsg] = useState('');
  const [forumIsAnnouncement, setForumIsAnnouncement] = useState(false);
  const [forumPosting, setForumPosting] = useState(false);
  const forumPollRef = useRef(null);

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  const fetchEventData = useCallback(async () => {
    try {
      const [eventRes, participantsRes] = await Promise.all([
        axios.get(`/api/events/${eventId}`),
        axios.get(`/api/organizer/events/${eventId}/participants`)
      ]);
      setEvent(eventRes.data.event);
      setParticipants(participantsRes.data.participants || []);
    } catch (error) {
      toast.error('Error loading event data');
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
    }
  }, [eventId]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await axios.get(`/api/organizer/events/${eventId}/audit-logs`);
      setAuditLogs(res.data.logs || []);
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
  }, [eventId]);

  const fetchForumMessages = useCallback(async () => {
    try {
      const res = await axios.get(`/api/forum/events/${eventId}/messages`);
      setForumMessages(res.data.messages || []);
    } catch (_) {}
  }, [eventId]);

  const handleForumPost = async (e) => {
    e.preventDefault();
    if (!forumNewMsg.trim()) return;
    setForumPosting(true);
    try {
      await axios.post(`/api/forum/events/${eventId}/messages`, {
        content: forumNewMsg.trim(),
        isAnnouncement: forumIsAnnouncement
      });
      setForumNewMsg('');
      setForumIsAnnouncement(false);
      fetchForumMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post message');
    } finally {
      setForumPosting(false);
    }
  };

  const handleForumDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/forum/messages/${messageId}`);
      fetchForumMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleForumPin = async (messageId) => {
    try {
      await axios.put(`/api/forum/messages/${messageId}/pin`);
      fetchForumMessages();
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  };

  useEffect(() => {
    if (eventId) fetchEventData();
  }, [eventId, fetchEventData]);

  useEffect(() => {
    if (eventId && activeTab === 'feedback') fetchFeedback();
  }, [eventId, activeTab, fetchFeedback]);

  useEffect(() => {
    if (activeTab === 'participants') {
      pollingRef.current = setInterval(() => {
        fetchEventData();
      }, 10000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeTab, fetchEventData]);

  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchForumMessages();
      forumPollRef.current = setInterval(fetchForumMessages, 8000);
    }
    return () => {
      if (forumPollRef.current) clearInterval(forumPollRef.current);
    };
  }, [activeTab, fetchForumMessages]);

  useEffect(() => {
    if (cameraActive && videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          processScannedCode(result.data);
          qrScanner.stop();
          setCameraActive(false);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );
      scannerRef.current = qrScanner;
      qrScanner.start().catch(() => {
        toast.error('Could not access camera');
        setCameraActive(false);
      });
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [cameraActive]);

  const processScannedCode = async (rawValue) => {
    if (!rawValue || !rawValue.trim()) return;
    setScanning(true);
    let ticketId = rawValue.trim();
    try {
      const parsed = JSON.parse(ticketId);
      if (parsed && parsed.ticketId) ticketId = String(parsed.ticketId);
    } catch (_) {}
    try {
      const res = await axios.post('/api/organizer/attendance/scan', { ticketId, eventId });
      toast.success(res.data.message);
      fetchEventData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error scanning QR code');
    } finally {
      setScanning(false);
    }
  };

  const handleScanQR = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    await processScannedCode(qrCode);
    setQrCode('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      await processScannedCode(result.data);
    } catch (err) {
      toast.error('Could not read QR code from the image');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      const res = await axios.put('/api/organizer/attendance/override', {
        registrationId: overrideModal.registrationId,
        attended: !overrideModal.attended,
        reason: overrideReason.trim()
      });
      toast.success(res.data.message);
      fetchEventData();
      setOverrideModal({ show: false, registrationId: null, name: '', attended: false });
      setOverrideReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Override failed');
    }
  };

  const handlePublishEvent = async () => {
    if (!window.confirm('Are you sure you want to publish this event? It will be visible to all participants.')) return;
    try {
      await axios.put(`/api/events/${eventId}/publish`);
      toast.success('Event published successfully!');
      fetchEventData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
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

  const attendanceRate = participants.length > 0
    ? (participants.filter((p) => p.attended).length / participants.length * 100).toFixed(1)
    : 0;

  const visibleParticipants =
    filter === 'attended' ? participants.filter((p) => p.attended) :
    filter === 'notAttended' ? participants.filter((p) => !p.attended) :
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
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
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
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'feedback' ? '3px solid #007bff' : 'none',
            fontWeight: activeTab === 'feedback' ? 'bold' : 'normal'
          }}>
          Feedback
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'discussion' ? '3px solid #007bff' : 'none',
            fontWeight: activeTab === 'discussion' ? 'bold' : 'normal',
            marginLeft: '10px'
          }}>
          Discussion
        </button>
      </div>

      {activeTab === 'participants' &&
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Scan QR Code for Attendance</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setCameraActive(!cameraActive)}>
                {cameraActive ? 'Stop Camera' : 'Open Camera Scanner'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                Upload QR Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {cameraActive && (
              <div style={{ marginBottom: '15px', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #007bff' }}>
                <video ref={videoRef} style={{ width: '100%', display: 'block' }} />
              </div>
            )}

            <form onSubmit={handleScanQR} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Or enter ticket ID manually"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={scanning}>
                {scanning ? 'Scanning...' : 'Mark Attendance'}
              </button>
            </form>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            <button
              className="btn btn-secondary"
              style={{ marginLeft: 'auto' }}
              onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchAuditLogs(); }}>
              {showLogs ? 'Hide Audit Logs' : 'View Audit Logs'}
            </button>
          </div>

          {showLogs && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Audit Logs</h3>
              {auditLogs.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Performed By</th>
                        <th>Reason</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.action === 'MANUAL_MARK_ATTENDED' ? 'Marked Attended' : 'Unmarked Attended'}</td>
                          <td>{log.performedBy?.organizerName || log.performedBy?.email || '—'}</td>
                          <td>{log.reason}</td>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#6c757d', textAlign: 'center' }}>No audit logs yet</p>
              )}
            </div>
          )}

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
                      p.attended ? 'Attended' : 'Not Attended'
                    ];
                  });
                  downloadCsv(`participants_${eventId}.csv`, headers, rows);
                }}>
                Export CSV
              </button>
            </div>
            {visibleParticipants.length > 0 ? (
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
                      <th>Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleParticipants.map((participant, index) => (
                      <tr key={participant._id}>
                        <td>{index + 1}</td>
                        <td>{participant.participantId ? `${participant.participantId.firstName} ${participant.participantId.lastName}` : '—'}</td>
                        <td>{participant.participantId?.email || '—'}</td>
                        <td><code>{participant.ticketId}</code></td>
                        <td>{participant.registrationDate ? new Date(participant.registrationDate).toLocaleString() : '—'}</td>
                        <td>
                          {participant.attended
                            ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Attended</span>
                            : <span style={{ color: '#dc3545' }}>✗ Not Attended</span>
                          }
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setOverrideModal({
                              show: true,
                              registrationId: participant._id,
                              name: participant.participantId ? `${participant.participantId.firstName} ${participant.participantId.lastName}` : 'Unknown',
                              attended: participant.attended
                            })}>
                            {participant.attended ? 'Unmark' : 'Mark'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No participants yet</p>
            )}
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
                  f.submittedAt ? new Date(f.submittedAt).toISOString() : ''
                ]);
                downloadCsv(`feedback_${eventId}.csv`, headers, rows);
              }}
              disabled={!feedback || feedback.length === 0}>
              Export CSV
            </button>
          </div>
          {feedback.length > 0 ? (
            <div>
              {feedback.map((item, index) => (
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
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No feedback yet</p>
          )}
        </div>
      }

      {activeTab === 'discussion' &&
        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>Discussion Forum (Moderator View)</h2>
          <form onSubmit={handleForumPost} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <input
                type="text"
                value={forumNewMsg}
                onChange={(e) => setForumNewMsg(e.target.value)}
                placeholder="Post a message or announcement..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={forumPosting}>
                {forumPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
            <label style={{ fontSize: '0.9em', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={forumIsAnnouncement}
                onChange={(e) => setForumIsAnnouncement(e.target.checked)}
                style={{ marginRight: '6px' }}
              />
              Post as Announcement
            </label>
          </form>
          {forumMessages.length > 0 ? (
            <div>
              {forumMessages.map((msg) => (
                <div key={msg._id} style={{
                  padding: '12px', marginBottom: '10px', borderRadius: '6px',
                  backgroundColor: msg.isPinned ? '#fff8e1' : msg.isAnnouncement ? '#e3f2fd' : '#f8f9fa',
                  border: msg.isPinned ? '2px solid #ffc107' : '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong>
                      {msg.userId?.firstName || 'User'} {msg.userId?.lastName || ''}
                      {msg.isAnnouncement && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#1565c0' }}>📢 Announcement</span>}
                      {msg.isPinned && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#f57f17' }}>📌 Pinned</span>}
                    </strong>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleForumPin(msg._id)}>
                        {msg.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleForumDelete(msg._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 4px 0' }}>{msg.content}</p>
                  <small style={{ color: '#6c757d' }}>{new Date(msg.createdAt).toLocaleString()}</small>
                  {msg.replies && msg.replies.length > 0 && (
                    <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: '2px solid #dee2e6' }}>
                      {msg.replies.map((reply) => (
                        <div key={reply._id} style={{ padding: '8px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.9em' }}>{reply.userId?.firstName || 'User'} {reply.userId?.lastName || ''}</strong>
                            <button className="btn btn-sm btn-danger" onClick={() => handleForumDelete(reply._id)} style={{ fontSize: '0.75em' }}>Delete</button>
                          </div>
                          <p style={{ margin: '2px 0', fontSize: '0.9em' }}>{reply.content}</p>
                          <small style={{ color: '#6c757d', fontSize: '0.8em' }}>{new Date(reply.createdAt).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No discussion messages yet</p>
          )}
        </div>
      }

      {overrideModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '30px',
            width: '100%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0 }}>Manual Attendance Override</h3>
            <p>
              {overrideModal.attended ? 'Unmark' : 'Mark'} attendance for <strong>{overrideModal.name}</strong>?
            </p>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason (required)</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
                placeholder="e.g. Participant arrived late, manual verification done"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setOverrideModal({ show: false, registrationId: null, name: '', attended: false }); setOverrideReason(''); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleManualOverride}>
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagement;
