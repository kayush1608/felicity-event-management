import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

const sortFields = (fields) => {
  const arr = Array.isArray(fields) ? [...fields] : [];
  return arr.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};

function EventDetails() {
  const params = useParams();
  const eventId = params.eventId || params.id;
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttended, setHasAttended] = useState(false);
  const [myTicket, setMyTicket] = useState(null);


  const [formResponses, setFormResponses] = useState({});
  const [formFiles, setFormFiles] = useState({});
  const [merch, setMerch] = useState({ size: '', color: '', variant: '', quantity: 1 });


  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
    } catch (error) {
      toast.error('Error loading event');
      console.error(error);
    } finally {
      setLoading(false);
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
        const purchaseLimit = Number(event.purchaseLimit || 1);
        const qty = Number(merch.quantity || 1);
        if (!Number.isFinite(qty) || qty <= 0) {
          toast.error('Invalid quantity');
          setRegistering(false);
          return;
        }
        if (Number.isFinite(purchaseLimit) && purchaseLimit > 0 && qty > purchaseLimit) {
          toast.error(`You can purchase at most ${purchaseLimit} item(s)`);
          setRegistering(false);
          return;
        }
        if ((event.stockQuantity ?? 0) < qty) {
          toast.error('Not enough stock available');
          setRegistering(false);
          return;
        }

        merchandiseDetails = {
          size: merch.size,
          color: merch.color,
          variant: merch.variant,
          quantity: qty
        };
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

        
        {canRegister &&
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Register for this Event</h3>

            {event.eventType === 'Normal' && customFields.length > 0 &&
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
                    <select value={merch.size} onChange={(e) => setMerch((prev) => ({ ...prev, size: e.target.value }))} required>
                      <option value="">Select size</option>
                      {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
            }
                {colors.length > 0 &&
            <div className="form-group">
                    <label>Color *</label>
                    <select value={merch.color} onChange={(e) => setMerch((prev) => ({ ...prev, color: e.target.value }))} required>
                      <option value="">Select color</option>
                      {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
            }
                {variants.length > 0 &&
            <div className="form-group">
                    <label>Variant *</label>
                    <select value={merch.variant} onChange={(e) => setMerch((prev) => ({ ...prev, variant: e.target.value }))} required>
                      <option value="">Select variant</option>
                      {variants.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
            }

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                type="number"
                min="1"
                max={Number(event.purchaseLimit || 1)}
                value={merch.quantity}
                onChange={(e) => setMerch((prev) => ({ ...prev, quantity: e.target.value }))}
                required />

                  <small style={{ color: '#6c757d' }}>
                    Limit: {event.purchaseLimit || 1} • Available stock: {event.stockQuantity ?? 0}
                  </small>
                </div>
              </div>
          }

            <button
            className="btn btn-primary"
            style={{ marginTop: '15px' }}
            onClick={handleRegister}
            disabled={registering}>

              {registering ? 'Registering...' : 'Register Now'}
            </button>
          </div>
        }

        
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
      </div>
    </div>);

}

export default EventDetails;
