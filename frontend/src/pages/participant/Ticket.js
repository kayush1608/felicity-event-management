import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

function Ticket() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`/api/participant/registration/${ticketId}`);
        setRegistration(res.data.registration);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) return <div className="loading">Loading ticket...</div>;
  if (!registration) return <div className="container"><p>Ticket not found</p></div>;

  const event = registration.eventId;

  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Back
      </button>

      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Your Ticket</h1>

        <p style={{ margin: '10px 0' }}>
          <strong>Ticket ID:</strong> <code>{registration.ticketId}</code>
        </p>

        {event &&
        <p style={{ margin: '10px 0', color: '#6c757d' }}>
            {event.eventName} • {new Date(event.eventStartDate).toLocaleDateString()}
          </p>
        }

        {registration.qrCode ?
        <div style={{ marginTop: '20px' }}>
            <img
            src={registration.qrCode}
            alt="Ticket QR"
            style={{ width: '260px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />

            <p style={{ marginTop: '10px', color: '#6c757d', fontSize: '13px' }}>
              Show this QR code at check-in.
            </p>
          </div> :

        <p style={{ color: '#dc3545' }}>No QR code found for this ticket.</p>
        }
      </div>
    </div>);

}

export default Ticket;
