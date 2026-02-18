import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComments, setAdminComments] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/password-reset-requests', {
        params: { status: filter }
      });
      setRequests(res.data.requests);
    } catch (error) {
      toast.error('Error loading requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const processRequest = async (id, status) => {
    try {
      const res = await axios.put(`/api/admin/password-reset-requests/${id}`, {
        status,
        adminComments
      });

      if (status === 'Approved') {
        toast.success(`Password reset approved! New password: ${res.data.request.newPassword}`, {
          autoClose: 10000
        });
      } else {
        toast.success('Password reset request rejected');
      }

      setSelectedRequest(null);
      setAdminComments('');
      fetchRequests();
    } catch (error) {
      toast.error('Error processing request');
    }
  };

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Password Reset Requests</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Pending', 'Approved', 'Rejected'].map((status) =>
          <button
            key={status}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(status)}>

              {status} ({requests.filter((r) => r.status === status).length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setFilter('')}>
            All ({requests.length})
          </button>
        </div>
      </div>

      {requests.length === 0 ?
      <div className="card">
          <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            No {filter.toLowerCase()} password reset requests found.
          </p>
        </div> :

      <div className="card">
          <table>
            <thead>
              <tr>
                <th>Organizer</th>
                <th>Category</th>
                <th>Reason</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) =>
            <tr key={req._id}>
                  <td><strong>{req.organizerId?.organizerName}</strong></td>
                  <td><span className="badge badge-normal">{req.organizerId?.category}</span></td>
                  <td>{req.reason}</td>
                  <td>{new Date(req.requestDate).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                req.status === 'Pending' ? 'badge-ongoing' :
                req.status === 'Approved' ? 'badge-published' :
                'badge-closed'}`
                }>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'Pending' ?
                <button
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => setSelectedRequest(req)}>

                        Review
                      </button> :

                <span style={{ fontSize: '12px', color: '#666' }}>
                        {req.status} on {new Date(req.resolvedDate).toLocaleDateString()}
                      </span>
                }
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {selectedRequest &&
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', margin: '20px' }}>
            <h2>Review Password Reset Request</h2>
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Organizer:</strong> {selectedRequest.organizerId?.organizerName}</p>
              <p><strong>Email:</strong> {selectedRequest.organizerId?.email}</p>
              <p><strong>Category:</strong> {selectedRequest.organizerId?.category}</p>
              <p><strong>Request Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}</p>
              <p><strong>Reason:</strong></p>
              <p style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                {selectedRequest.reason}
              </p>
            </div>

            <div className="form-group">
              <label>Admin Comments (Optional)</label>
              <textarea
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              rows="3"
              placeholder="Add any comments or notes..." />

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
              className="btn btn-primary"
              onClick={() => processRequest(selectedRequest._id, 'Approved')}>

                Approve & Reset Password
              </button>
              <button
              className="btn btn-danger"
              onClick={() => processRequest(selectedRequest._id, 'Rejected')}>

                Reject
              </button>
              <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedRequest(null);
                setAdminComments('');
              }}>

                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}

export default PasswordResetRequests;
