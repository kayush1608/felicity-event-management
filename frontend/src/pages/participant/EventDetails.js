import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const sortFields = (fields) => {
  const arr = Array.isArray(fields) ? [...fields] : [];
  return arr.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};

function EventDetails() {
  const params = useParams();
  const eventId = params.eventId || params.id;
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttended, setHasAttended] = useState(false);
  const [myTicket, setMyTicket] = useState(null);


  const [formResponses, setFormResponses] = useState({});
  const [formFiles, setFormFiles] = useState({});
  const [merch, setMerch] = useState({ size: '', color: '', variant: '', quantity: 1 });
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [showInviteCode, setShowInviteCode] = useState(null); // holds invite code string
  const [acceptingMember, setAcceptingMember] = useState(null); // memberId being accepted


  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [forumMessages, setForumMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [postingMessage, setPostingMessage] = useState(false);
  const pollRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const [newMsgAlert, setNewMsgAlert] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await axios.get(`/api/participant/events/${eventId}`);
      const payload = res.data.data;
      setEvent(payload.event);
      setIsRegistered(payload.isRegistered);
      setHasAttended(payload.hasAttended);
      setMyTicket(payload.myTicket || null);
      const ev = payload.event;
      if (ev?.eventType === 'Merchandise') {
        const sizes = Array.isArray(ev.itemDetails?.sizes) ? ev.itemDetails.sizes : [];
        const colors = Array.isArray(ev.itemDetails?.colors) ? ev.itemDetails.colors : [];
        const variants = Array.isArray(ev.itemDetails?.variants) ? ev.itemDetails.variants : [];
        setMerch((prev) => ({
          size: prev.size || sizes[0] || '',
          color: prev.color || colors[0] || '',
          variant: prev.variant || variants[0] || '',
          quantity: prev.quantity || 1
        }));
      }
      // Fetch team data for hackathon events
      if (ev?.eventType === 'Hackathon') {
        fetchMyTeam();
      }
    } catch (error) {
      toast.error('Error loading event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchMyTeam = useCallback(async () => {
    try {
      const res = await axios.get(`/api/teams/event/${eventId}/my-team`);
      setMyTeam(res.data.data || null);
    } catch (err) {
      console.error('Fetch my team error:', err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const payloadFormFields = sortFields(event?.customFormFields);


      if (event?.eventType === 'Normal' && payloadFormFields.length > 0) {
        for (const field of payloadFormFields) {
          if (!field.isRequired) continue;

          if (field.fieldType === 'file') {
            if (!formFiles[field.fieldName]) {
              toast.error(`Please upload: ${field.fieldName}`);
              setRegistering(false);
              return;
            }
          } else {
            const val = formResponses[field.fieldName];
            const isEmpty =
              val === undefined ||
              val === null ||
              String(val).trim() === '' ||
              (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              toast.error(`Please fill: ${field.fieldName}`);
              setRegistering(false);
              return;
            }
          }
        }
      }

      let merchandiseDetails = {};
      if (event?.eventType === 'Merchandise') {
        const qty = Number(merch.quantity || 1);
        const limit = Number(event.purchaseLimit || 1);
        if (!Number.isFinite(qty) || qty <= 0) { toast.error('Invalid quantity'); setRegistering(false); return; }
        if (limit > 0 && qty > limit) { toast.error(`Max ${limit} item(s)`); setRegistering(false); return; }
        if ((event.stockQuantity ?? 0) < qty) { toast.error('Not enough stock'); setRegistering(false); return; }
        merchandiseDetails = { size: merch.size, color: merch.color, variant: merch.variant, quantity: qty };
      }

      const hasFiles = Object.keys(formFiles).length > 0;

      let res;
      if (hasFiles) {
        const fd = new FormData();
        fd.append('formResponses', JSON.stringify(formResponses || {}));
        fd.append('merchandiseDetails', JSON.stringify(merchandiseDetails || {}));
        for (const [fieldName, file] of Object.entries(formFiles)) {
          if (file) fd.append(fieldName, file);
        }
        res = await axios.post(`/api/participant/events/${eventId}/register`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`/api/participant/events/${eventId}/register`, {
          formResponses,
          merchandiseDetails
        });
      }

      toast.success(res.data.message);
      const ticketId = res.data.registration?.ticketId;
      if (ticketId) {
        navigate(`/ticket/${ticketId}`);
      } else {
        fetchEvent();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error registering for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await axios.post(`/api/participant/events/${eventId}/feedback`, feedback);
      toast.success('Feedback submitted successfully!');
      setShowFeedback(false);
      setFeedback({ rating: 5, comments: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const fetchForumMessages = useCallback(async () => {
    try {
      const res = await axios.get(`/api/forum/events/${eventId}/messages`);
      const msgs = res.data.messages || [];
      // Count total messages including replies
      const totalCount = msgs.reduce((sum, m) => sum + 1 + (m.replies?.length || 0), 0);
      if (prevMsgCountRef.current > 0 && totalCount > prevMsgCountRef.current) {
        setNewMsgAlert(true);
        toast.info(`${totalCount - prevMsgCountRef.current} new message(s) in discussion`, { autoClose: 3000 });
      }
      prevMsgCountRef.current = totalCount;
      setForumMessages(msgs);
    } catch (err) {
      console.error('Forum fetch error:', err);
    }
  }, [eventId]);

  useEffect(() => {
    if (isRegistered) {
      fetchForumMessages();
      pollRef.current = setInterval(fetchForumMessages, 8000);
      return () => clearInterval(pollRef.current);
    }
  }, [isRegistered, fetchForumMessages]);

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setPostingMessage(true);
    try {
      await axios.post(`/api/forum/events/${eventId}/messages`, {
        content: newMessage.trim(),
        parentMessage: replyTo
      });
      setNewMessage('');
      setReplyTo(null);
      fetchForumMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error posting message');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/forum/messages/${messageId}`);
      fetchForumMessages();
    } catch (err) {
      toast.error('Error deleting message');
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await axios.post(`/api/forum/messages/${messageId}/react`, { emoji });
      fetchForumMessages();
    } catch (err) {
      toast.error('Error reacting');
    }
  };

  if (loading) return <div className="loading">Loading event...</div>;
  if (!event) return <div className="container"><p>Event not found</p></div>;

  const isPastEvent = new Date(event.eventStartDate) < new Date();
  const isRegistrationClosed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isFull = event.registrationLimit && event.totalRegistrations >= event.registrationLimit;
  const canRegister = !isRegistered && !isPastEvent && !isRegistrationClosed && !isFull;

  const customFields = sortFields(event.customFormFields);
  const sizes = Array.isArray(event.itemDetails?.sizes) ? event.itemDetails.sizes : [];
  const colors = Array.isArray(event.itemDetails?.colors) ? event.itemDetails.colors : [];
  const variants = Array.isArray(event.itemDetails?.variants) ? event.itemDetails.variants : [];

  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate('/events')} style={{ marginBottom: '20px' }}>
        ← Back to Events
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>{event.eventName}</h1>
          <span style={{
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: event.eventType === 'Hackathon' ? '#e7f3ff' : event.eventType === 'Merchandise' ? '#fff3cd' : '#d4edda',
            color: event.eventType === 'Hackathon' ? '#004085' : event.eventType === 'Merchandise' ? '#856404' : '#155724'
          }}>
            {event.eventType}
          </span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{event.eventDescription}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h3>Event Details</h3>
            <p><strong>Date:</strong> {new Date(event.eventStartDate).toLocaleDateString()}</p>
            <p><strong>Eligibility:</strong> {event.eligibility}</p>
          </div>

          <div>
            <h3>Registration Info</h3>
            <p><strong>Registrations:</strong> {event.totalRegistrations || 0}
              {event.registrationLimit ? ` / ${event.registrationLimit}` : ''}
            </p>
            {event.registrationDeadline &&
            <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
            }
            {event.eventType === 'Merchandise' &&
            <>
                <p><strong>Fee:</strong> ₹{event.registrationFee || 0}</p>
                <p><strong>Stock:</strong> {event.stockQuantity ?? 0}</p>
              </>
            }
            {event.eventType === 'Hackathon' &&
            <>
                <p><strong>Team Size:</strong> {event.teamSize?.min} - {event.teamSize?.max} members</p>
              </>
            }
          </div>

          <div>
            <h3>Organizer</h3>
            <p><strong>Name:</strong> {event.organizerId?.organizerName}</p>
            <p><strong>Category:</strong> {event.organizerId?.category}</p>
          </div>
        </div>

        
        {isRegistered &&
        <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#155724', fontWeight: 'bold' }}>✓ You are registered for this event</p>
            <p style={{ margin: '5px 0 0 0', color: '#155724' }}>
              {myTicket?.ticketId ?
            <>
                  Ticket ID: <code style={{ cursor: 'pointer' }} onClick={() => navigate(`/ticket/${myTicket.ticketId}`)}>{myTicket.ticketId}</code>
                  <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: '10px' }}
                onClick={() => navigate(`/ticket/${myTicket.ticketId}`)}>

                    View QR / Ticket
                  </button>
                </> :

            'Ticket ID will be visible in Dashboard/Profile.'
            }
            </p>
          </div>
        }

        
        {canRegister && event.eventType !== 'Hackathon' &&
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Register for this Event</h3>

            {customFields.length > 0 &&
          <div style={{ marginTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>Registration Form</h4>
                {customFields.map((field) => {
              const label = field.fieldName;
              const required = !!field.isRequired;
              const type = field.fieldType;
              const placeholder = field.placeholder || '';
              const options = Array.isArray(field.options) ? field.options : [];
              const value = formResponses[label] ?? '';

              const setValue = (v) => setFormResponses((prev) => ({ ...prev, [label]: v }));

              return (
                <div key={label} className="form-group">
                      <label>
                        {label}{required ? ' *' : ''}
                      </label>

                      {type === 'textarea' ?
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                    required={required} /> :

                  type === 'dropdown' ?
                  <select value={value} onChange={(e) => setValue(e.target.value)} required={required}>
                          <option value="">Select...</option>
                          {options.map((opt) =>
                    <option key={opt} value={opt}>{opt}</option>
                    )}
                        </select> :
                  type === 'radio' ?
                  <div style={{ display: 'grid', gap: '6px' }}>
                          {options.map((opt) =>
                    <label key={opt} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                        type="radio"
                        name={`radio_${label}`}
                        checked={value === opt}
                        onChange={() => setValue(opt)} />

                              {opt}
                            </label>
                    )}
                        </div> :
                  type === 'checkbox' ?
                  <div style={{ display: 'grid', gap: '6px' }}>
                          {options.length > 0 ? options.map((opt) => {
                      const arr = Array.isArray(value) ? value : [];
                      const checked = arr.includes(opt);
                      return (
                        <label key={opt} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked ?
                              [...arr, opt] :
                              arr.filter((x) => x !== opt);
                              setValue(next);
                            }} />

                                {opt}
                              </label>);

                    }) :
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => setValue(e.target.checked)} />

                              Yes
                            </label>
                    }
                        </div> :
                  type === 'file' ?
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormFiles((prev) => ({ ...prev, [label]: file || null }));
                    }}
                    required={required} /> :


                  <input
                    type={['text', 'number', 'email', 'tel', 'date'].includes(type) ? type : 'text'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    required={required} />

                  }
                    </div>);

            })}
              </div>
          }

            {event.eventType === 'Merchandise' &&
          <div style={{ marginTop: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>Purchase Details</h4>
                {sizes.length > 0 &&
            <div className="form-group">
                    <label>Size *</label>
                    <select value={merch.size} onChange={(e) => setMerch((prev) => ({ ...prev, size: e.target.value }))}>
                      <option value="">Select size</option>
                      {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
            }
                {colors.length > 0 &&
            <div className="form-group">
                    <label>Color *</label>
                    <select value={merch.color} onChange={(e) => setMerch((prev) => ({ ...prev, color: e.target.value }))}>
                      <option value="">Select color</option>
                      {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
            }
                {variants.length > 0 &&
            <div className="form-group">
                    <label>Variant *</label>
                    <select value={merch.variant} onChange={(e) => setMerch((prev) => ({ ...prev, variant: e.target.value }))}>
                      <option value="">Select variant</option>
                      {variants.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
            }
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" min="1" max={Number(event.purchaseLimit || 1)}
                    value={merch.quantity}
                    onChange={(e) => setMerch((prev) => ({ ...prev, quantity: e.target.value }))} required />
                  <small style={{ color: '#6c757d' }}>
                    Limit: {event.purchaseLimit || 1} &bull; Stock: {event.stockQuantity ?? 0}
                  </small>
                </div>
              </div>
          }

            {event.eventType !== 'Hackathon' &&
            <button
            className="btn btn-primary"
            style={{ marginTop: '15px' }}
            onClick={handleRegister}
            disabled={registering}>

              {registering ? 'Registering...' : 'Register Now'}
            </button>
            }
          </div>
        }

        {/* Hackathon team section — always visible for hackathon events, regardless of registration status */}
        {event.eventType === 'Hackathon' && (
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Team Options</h3>

            {/* Invite Code Modal/Banner after creation */}
            {showInviteCode && (
              <div style={{ padding: '16px', backgroundColor: '#d4edda', borderRadius: '8px', marginBottom: '16px', border: '2px solid #28a745' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#155724' }}>Team Created Successfully!</h4>
                <p style={{ margin: '0 0 8px 0', color: '#155724' }}>Share this invite code with your teammates:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ fontSize: '20px', fontWeight: 'bold', padding: '8px 16px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #28a745', letterSpacing: '2px', userSelect: 'all' }}>{showInviteCode}</code>
                  <button className="btn btn-outline-success btn-sm" onClick={() => { navigator.clipboard.writeText(showInviteCode); toast.success('Invite code copied!'); }}>Copy</button>
                </div>
                <button className="btn btn-sm" style={{ marginTop: '10px', color: '#6c757d' }} onClick={() => setShowInviteCode(null)}>Dismiss</button>
              </div>
            )}

            {/* Show existing team info */}
            {myTeam ? (
              <div style={{ padding: '16px', backgroundColor: '#e7f3ff', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#004085' }}>Your Team: {myTeam.teamName}</h4>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: myTeam.isComplete ? '#d4edda' : '#fff3cd', color: myTeam.isComplete ? '#155724' : '#856404' }}>
                    {myTeam.isComplete ? 'Complete' : 'Forming'}
                  </span>
                </div>

                {/* Invite code always visible for team leader */}
                {!myTeam.isComplete && (myTeam.teamLeaderId?._id?.toString() === authUser?._id?.toString() || myTeam.teamLeaderId?._id?.toString() === authUser?.id?.toString()) && (
                  <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '6px', marginBottom: '12px', border: '1px dashed #007bff' }}>
                    <small style={{ color: '#6c757d' }}>Invite Code (share with teammates):</small>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <code style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', userSelect: 'all' }}>{myTeam.inviteCode}</code>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => { navigator.clipboard.writeText(myTeam.inviteCode); toast.success('Invite code copied!'); }}>Copy</button>
                    </div>
                  </div>
                )}

                {/* Members list */}
                <div style={{ marginTop: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>Members ({myTeam.members?.filter(m => m.status === 'Accepted').length || 0} / {myTeam.teamSize} required):</strong>
                  <div style={{ marginTop: '6px' }}>
                    {/* Leader */}
                    <div style={{ padding: '6px 10px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{myTeam.teamLeaderId?.firstName || myTeam.teamLeaderId?.name || myTeam.teamLeaderId?.email || 'Leader'} <span style={{ color: '#007bff', fontSize: '11px', fontWeight: 'bold' }}>LEADER</span></span>
                      <span style={{ color: '#28a745', fontSize: '12px' }}>Accepted</span>
                    </div>
                    {/* Other members */}
                    {myTeam.members?.filter(m => m.userId?._id !== myTeam.teamLeaderId?._id).map((m) => {
                      const memberName = m.userId?.firstName || m.userId?.name || m.userId?.email || 'Member';
                      const isLeader = myTeam.teamLeaderId?._id?.toString() === authUser?._id?.toString() || myTeam.teamLeaderId?._id?.toString() === authUser?.id?.toString();
                      return (
                        <div key={m._id} style={{ padding: '6px 10px', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{memberName}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: m.status === 'Accepted' ? '#28a745' : m.status === 'Pending' ? '#ffc107' : '#6c757d' }}>{m.status}</span>
                            {isLeader && m.status === 'Pending' && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                disabled={acceptingMember === m._id}
                                onClick={async () => {
                                  setAcceptingMember(m._id);
                                  try {
                                    await axios.post(`/api/teams/${myTeam._id}/accept/${m._id}`);
                                    toast.success(`${memberName} accepted!`);
                                    fetchMyTeam();
                                    fetchEvent();
                                  } catch (err) {
                                    toast.error(err.response?.data?.message || 'Error accepting member');
                                  } finally { setAcceptingMember(null); }
                                }}>
                                {acceptingMember === m._id ? '...' : 'Accept'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {myTeam.isComplete && (
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '6px' }}>
                    <p style={{ margin: 0, color: '#155724', fontWeight: 'bold' }}>✓ Team is complete! All members have been registered and QR tickets sent via email.</p>
                  </div>
                )}
              </div>
            ) : (
              /* No team yet — show Create / Join options */
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Create team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    style={{ flex: 1 }} />
                  <button
                    className="btn btn-outline-primary"
                    disabled={creatingTeam || !teamName.trim()}
                    onClick={async () => {
                      setCreatingTeam(true);
                      try {
                        const res = await axios.post('/api/teams', { teamName, eventId });
                        const code = res.data.data?.inviteCode || '';
                        setShowInviteCode(code);
                        toast.success('Team created!');
                        setTeamName('');
                        fetchMyTeam();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Error creating team');
                      } finally { setCreatingTeam(false); }
                    }}>
                    {creatingTeam ? 'Creating...' : 'Create Team'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter invite code to join"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    style={{ flex: 1 }} />
                  <button
                    className="btn btn-outline-success"
                    disabled={joiningTeam || !inviteCodeInput.trim()}
                    onClick={async () => {
                      setJoiningTeam(true);
                      try {
                        await axios.post('/api/teams/join', { inviteCode: inviteCodeInput.trim() });
                        toast.success('Join request sent!');
                        setInviteCodeInput('');
                        fetchMyTeam();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Error joining team');
                      } finally { setJoiningTeam(false); }
                    }}>
                    {joiningTeam ? 'Joining...' : 'Join Team'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        
        {!canRegister && !isRegistered &&
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#856404', fontWeight: 'bold' }}>
              {isPastEvent && '⚠ This event has already passed'}
              {isRegistrationClosed && !isPastEvent && '⚠ Registration deadline has passed'}
              {isFull && !isPastEvent && !isRegistrationClosed && '⚠ Event is full'}
            </p>
          </div>
        }

        
        {isRegistered && hasAttended &&
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            {!showFeedback ?
          <div>
                <h3>Share Your Feedback</h3>
                <p style={{ color: '#6c757d' }}>Help us improve future events by sharing your experience</p>
                <button className="btn btn-primary" onClick={() => setShowFeedback(true)}>
                  Give Feedback
                </button>
              </div> :

          <form onSubmit={handleSubmitFeedback}>
                <h3>Event Feedback</h3>
                <div className="form-group">
                  <label>Rating (1-5 stars)</label>
                  <div style={{ display: 'flex', gap: '5px', fontSize: '30px' }}>
                    {[1, 2, 3, 4, 5].map((star) =>
                <span
                  key={star}
                  onClick={() => setFeedback({ ...feedback, rating: star })}
                  style={{ cursor: 'pointer', color: star <= feedback.rating ? '#ffc107' : '#dee2e6' }}>

                        ★
                      </span>
                )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <textarea
                value={feedback.comments}
                onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                required
                rows="4"
                placeholder="Share your thoughts about the event..." />

                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFeedback(false)}>

                    Cancel
                  </button>
                </div>
              </form>
          }
          </div>
        }

        {isRegistered &&
        <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Discussion Forum</h2>
              {newMsgAlert && (
                <span
                  onClick={() => setNewMsgAlert(false)}
                  style={{ cursor: 'pointer', padding: '2px 10px', backgroundColor: '#007bff', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  New messages!
                </span>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              {replyTo && (
                <div style={{ padding: '6px 10px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small>Replying to a message...</small>
                  <button className="btn btn-sm" onClick={() => setReplyTo(null)} style={{ padding: '2px 8px' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostMessage()}
                  placeholder={replyTo ? 'Write a reply...' : 'Write a message...'}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" disabled={postingMessage || !newMessage.trim()} onClick={handlePostMessage}>
                  {postingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>

            {forumMessages.length === 0 ? (
              <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No messages yet. Start the conversation!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {forumMessages.map((msg) => (
                  <div key={msg._id} style={{
                    padding: '12px',
                    backgroundColor: msg.isPinned ? '#fff3cd' : msg.isAnnouncement ? '#cce5ff' : '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: msg.isPinned ? '4px solid #ffc107' : msg.isAnnouncement ? '4px solid #007bff' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>
                        {msg.userId?.role === 'organizer' ? (msg.userId?.organizerName || 'Organizer') : `${msg.userId?.firstName || ''} ${msg.userId?.lastName || ''}`}
                        {msg.userId?.role === 'organizer' && <span style={{ color: '#007bff', marginLeft: '6px', fontSize: '11px' }}>ORGANIZER</span>}
                        {msg.isPinned && <span style={{ color: '#ffc107', marginLeft: '6px', fontSize: '11px' }}>📌 PINNED</span>}
                        {msg.isAnnouncement && <span style={{ color: '#007bff', marginLeft: '6px', fontSize: '11px' }}>📢 ANNOUNCEMENT</span>}
                      </strong>
                      <small style={{ color: '#6c757d' }}>{new Date(msg.createdAt).toLocaleString()}</small>
                    </div>
                    <p style={{ margin: '0 0 8px 0' }}>{msg.content}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => handleReact(msg._id, '👍')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}>
                        👍 {msg.reactions?.filter((r) => r.emoji === '👍').length || 0}
                      </button>
                      <button onClick={() => setReplyTo(msg._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#007bff' }}>
                        Reply
                      </button>
                      {(msg.userId?._id === authUser?._id || msg.userId?._id === authUser?.id) && (
                        <button onClick={() => handleDeleteMessage(msg._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#dc3545' }}>
                          Delete
                        </button>
                      )}
                    </div>

                    {msg.replies && msg.replies.length > 0 && (
                      <div style={{ marginTop: '10px', paddingLeft: '16px', borderLeft: '2px solid #dee2e6' }}>
                        {msg.replies.map((reply) => (
                          <div key={reply._id} style={{ padding: '8px', marginBottom: '6px', backgroundColor: '#fff', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '13px' }}>
                                {reply.userId?.role === 'organizer' ? (reply.userId?.organizerName || 'Organizer') : `${reply.userId?.firstName || ''} ${reply.userId?.lastName || ''}`}
                                {reply.userId?.role === 'organizer' && <span style={{ color: '#007bff', marginLeft: '4px', fontSize: '10px' }}>ORGANIZER</span>}
                              </strong>
                              <small style={{ color: '#6c757d' }}>{new Date(reply.createdAt).toLocaleString()}</small>
                            </div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{reply.content}</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleReact(reply._id, '👍')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}>
                                👍 {reply.reactions?.filter((r) => r.emoji === '👍').length || 0}
                              </button>
                              {(reply.userId?._id === authUser?._id || reply.userId?._id === authUser?.id) && (
                                <button onClick={() => handleDeleteMessage(reply._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#dc3545' }}>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      </div>
    </div>);

}

export default EventDetails;
