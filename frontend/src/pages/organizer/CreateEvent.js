import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';

const parseCommaList = (value) => {
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
};

const stringifyCommaList = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr.filter(Boolean).join(', ');
};

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'file', label: 'File Upload' }
];


function CreateEvent() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customFormFields, setCustomFormFields] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'Normal',
    category: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    venue: '',
    eligibility: 'All',
    maxParticipants: '',
    registrationDeadline: '',
    registrationDeadlineTime: '',
    discordWebhook: '',

    price: '',
    stock: '',
    purchaseLimit: '1',
    sizes: '',
    colors: '',
    variants: '',

    teamSize: '',
    problemStatement: ''
  });

  const fetchEvent = useCallback(async () => {
    try {
      const res = await axios.get(`/api/events/${editId}`);
      const event = res.data.event;

      const start = event.eventStartDate ? new Date(event.eventStartDate) : null;
      const date = start ? start.toISOString().split('T')[0] : '';
      const time = start ?
      `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` :
      '';

      const end = event.eventEndDate ? new Date(event.eventEndDate) : null;
      const endDate = end ? end.toISOString().split('T')[0] : '';
      const endTime = end ?
      `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` :
      '';

      const tags = Array.isArray(event.eventTags) ? event.eventTags : [];
      const venueTag = tags.find((t) => typeof t === 'string' && t.startsWith('venue:'));
      const venue = venueTag ? venueTag.replace(/^venue:/, '') : '';
      const category = tags.find((t) => typeof t === 'string' && !t.startsWith('venue:')) || '';

      const teamSize = event.teamSize?.min && event.teamSize?.max ?
      event.teamSize.min === event.teamSize.max ? String(event.teamSize.min) : `${event.teamSize.min}-${event.teamSize.max}` :
      '';

      setFormData({
        name: event.eventName,
        description: event.eventDescription,
        eventType: event.eventType,
        category,
        date,
        time,
        endDate,
        endTime,
        venue,
        eligibility: event.eligibility,
        maxParticipants: event.registrationLimit || '',
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
        registrationDeadlineTime: event.registrationDeadline ? `${String(new Date(event.registrationDeadline).getHours()).padStart(2,'0')}:${String(new Date(event.registrationDeadline).getMinutes()).padStart(2,'0')}` : '',
        discordWebhook: event.discordWebhook || '',
        price: event.registrationFee || '',
        stock: event.stockQuantity || '',
        purchaseLimit: event.purchaseLimit != null ? String(event.purchaseLimit) : '1',
        sizes: stringifyCommaList(event.itemDetails?.sizes),
        colors: stringifyCommaList(event.itemDetails?.colors),
        variants: stringifyCommaList(event.itemDetails?.variants),
        teamSize,
        problemStatement: event.problemStatement || ''
      });

      setCustomFormFields(Array.isArray(event.customFormFields) ? event.customFormFields : []);
    } catch (error) {
      toast.error('Error loading event');
      console.error(error);
    }
  }, [editId]);

  useEffect(() => {
    if (editId) {
      fetchEvent();
    }
  }, [editId, fetchEvent]);

  const addCustomField = () => {
    setCustomFormFields((prev) => [
    ...prev,
    {
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      options: [],
      placeholder: '',
      order: prev.length + 1
    }]
    );
  };

  const updateCustomField = (index, patch) => {
    setCustomFormFields((prev) => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  const removeCustomField = (index) => {
    setCustomFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCustomField = (from, to) => {
    setCustomFormFields((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };


      if (name === 'date' && value) {
        if (!next.endDate || next.endDate < value) {
          next.endDate = value;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { ...formData };

      if (data.registrationDeadline && formData.registrationDeadlineTime) {
        try {
          const combined = new Date(`${data.registrationDeadline}T${formData.registrationDeadlineTime}`);
          if (!Number.isNaN(combined.getTime())) {
            data.registrationDeadline = combined.toISOString();
          }
        } catch (e) {
          // ignore and send date-only value
        }
      }


      if (formData.eventType !== 'Merchandise') {
        delete data.price;
        delete data.stock;
        delete data.purchaseLimit;
        delete data.sizes;
        delete data.colors;
        delete data.variants;
      }
      if (formData.eventType !== 'Hackathon') {
        delete data.teamSize;
        delete data.problemStatement;
      }

      data.customFormFields = (customFormFields || []).map((f, idx) => {
          const options = Array.isArray(f.options) ?
          f.options :
          parseCommaList(f.options);
          return {
            fieldName: String(f.fieldName || '').trim(),
            fieldType: f.fieldType,
            isRequired: !!f.isRequired,
            options,
            placeholder: f.placeholder || '',
            order: idx + 1
          };
        }).filter((f) => f.fieldName);

      if (formData.eventType === 'Merchandise') {
        data.purchaseLimit = Number(formData.purchaseLimit || 1);
        data.itemDetails = {
          sizes: parseCommaList(formData.sizes),
          colors: parseCommaList(formData.colors),
          variants: parseCommaList(formData.variants)
        };
      }

      if (editId) {
        await axios.put(`/api/events/${editId}`, data);
        toast.success('Event updated successfully!');
      } else {
        await axios.post('/api/events', data);
        toast.success('Event created successfully!');
      }
      navigate('/ongoing-events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>{editId ? 'Edit Event' : 'Create New Event'}</h1>

      <form onSubmit={handleSubmit} className="card">
        
        <h2 style={{ marginBottom: '20px' }}>Basic Information</h2>
        
        <div className="form-group">
          <label>Event Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter event name" />

        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Describe your event" />

        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Event Type *</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} required>
              <option value="Normal">Normal Event</option>
              <option value="Merchandise">Merchandise</option>
              <option value="Hackathon">Hackathon</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="e.g., Technical, Cultural, Sports" />

          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required />

          </div>

          <div className="form-group">
            <label>Start Time *</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required />

          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.date || undefined}
              required />

            {formData.date && formData.endDate && formData.endDate < formData.date &&
            <small style={{ color: 'red' }}>End date cannot be before start date</small>
            }
          </div>

          <div className="form-group">
            <label>End Time *</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required />

          </div>
        </div>

        <div className="form-group">
          <label>Venue *</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            placeholder="Enter venue location" />

        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Eligibility *</label>
            <select name="eligibility" value={formData.eligibility} onChange={handleChange} required>
              <option value="All">All</option>
              <option value="IIIT Only">IIIT Only</option>
              <option value="Non-IIIT Only">Non-IIIT Only</option>
            </select>
          </div>

          <div className="form-group">
            <label>Max Participants</label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              min="1"
              placeholder="Leave empty for unlimited" />

          </div>
        </div>

        <div className="form-group">
          <label>Registration Deadline</label>
          <input
            type="date"
            name="registrationDeadline"
            value={formData.registrationDeadline}
            onChange={handleChange}
            max={formData.date || undefined} />

          {formData.date && formData.registrationDeadline && formData.registrationDeadline > formData.date &&
          <small style={{ color: 'red' }}>Registration deadline cannot be after event start date</small>
          }

          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block' }}>Registration Deadline Time</label>
            <input
              type="time"
              name="registrationDeadlineTime"
              value={formData.registrationDeadlineTime}
              onChange={handleChange}
              max={formData.time || undefined} />

            {formData.date && formData.registrationDeadline && formData.registrationDeadlineTime && (new Date(`${formData.registrationDeadline}T${formData.registrationDeadlineTime}`) > new Date(`${formData.date}T${formData.time || '00:00'}`)) &&
            <small style={{ color: 'red' }}>Registration deadline cannot be after event start date/time</small>
            }
          </div>
        </div>

        
        {formData.eventType === 'Merchandise' &&
        <>
            <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Merchandise Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange}
                  required={formData.eventType === 'Merchandise'} min="0" step="0.01" placeholder="Enter price" />
              </div>
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange}
                  required={formData.eventType === 'Merchandise'} min="0" placeholder="Enter available stock" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Limit Per Participant *</label>
                <input type="number" name="purchaseLimit" value={formData.purchaseLimit} onChange={handleChange}
                  required min="1" placeholder="e.g., 1" />
              </div>
            </div>
            <div className="form-group">
              <label>Available Sizes (comma-separated)</label>
              <input type="text" name="sizes" value={formData.sizes} onChange={handleChange}
                placeholder="e.g., S, M, L, XL" />
            </div>
            <div className="form-group">
              <label>Available Colors (comma-separated)</label>
              <input type="text" name="colors" value={formData.colors} onChange={handleChange}
                placeholder="e.g., Black, White, Blue" />
            </div>
            <div className="form-group">
              <label>Available Variants (comma-separated)</label>
              <input type="text" name="variants" value={formData.variants} onChange={handleChange}
                placeholder="e.g., Hoodie, T-Shirt" />
            </div>
          </>
        }

        
        <>
            <h2 style={{ marginTop: '30px', marginBottom: '10px' }}>Custom Registration Form (Optional)</h2>
            <p style={{ color: '#6c757d', marginTop: 0 }}>
              Add fields participants must fill during registration. The form gets locked after the first registration.
            </p>

            <div className="card" style={{ padding: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Fields ({customFormFields.length})</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomField}>
                  + Add Field
                </button>
              </div>

              {customFormFields.length === 0 ?
            <p style={{ color: '#6c757d', marginTop: '10px' }}>No custom fields added.</p> :

            <div style={{ marginTop: '15px', display: 'grid', gap: '12px' }}>
                  {customFormFields.map((field, idx) =>
              <div key={idx} style={{ padding: '12px', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Field Name / Label *</label>
                          <input
                      type="text"
                      value={field.fieldName || ''}
                      onChange={(e) => updateCustomField(idx, { fieldName: e.target.value })}
                      placeholder="e.g., GitHub Profile"
                      required />

                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Type *</label>
                          <select
                      value={field.fieldType || 'text'}
                      onChange={(e) => updateCustomField(idx, { fieldType: e.target.value })}>

                            {FIELD_TYPES.map((t) =>
                      <option key={t.value} value={t.value}>{t.label}</option>
                      )}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Placeholder</label>
                          <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateCustomField(idx, { placeholder: e.target.value })}
                      placeholder="Optional" />

                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                        type="checkbox"
                        checked={!!field.isRequired}
                        onChange={(e) => updateCustomField(idx, { isRequired: e.target.checked })} />

                            Required
                          </label>
                        </div>
                      </div>

                      {(field.fieldType === 'dropdown' || field.fieldType === 'radio' || field.fieldType === 'checkbox') &&
                <div className="form-group">
                          <label>Options (comma-separated)</label>
                          <input
                    type="text"
                    value={Array.isArray(field.options) ? field.options.join(', ') : field.options || ''}
                    onChange={(e) => updateCustomField(idx, { options: parseCommaList(e.target.value) })}
                    placeholder="e.g., Beginner, Intermediate, Advanced" />

                        </div>
                }

                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveCustomField(idx, idx - 1)} disabled={idx === 0}>
                          ↑
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveCustomField(idx, idx + 1)} disabled={idx === customFormFields.length - 1}>
                          ↓
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCustomField(idx)}>
                          Remove
                        </button>
                      </div>
                    </div>
              )}
                </div>
            }
            </div>
          </>

        
        {formData.eventType === 'Hackathon' &&
        <>
            <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Hackathon Details</h2>
            <div className="form-group">
              <label>Team Size *</label>
              <input
              type="number"
              name="teamSize"
              value={formData.teamSize}
              onChange={handleChange}
              required={formData.eventType === 'Hackathon'}
              min="2"
              max="10"
              placeholder="Enter required team size" />

            </div>

            <div className="form-group">
              <label>Problem Statement *</label>
              <textarea
              name="problemStatement"
              value={formData.problemStatement}
              onChange={handleChange}
              required={formData.eventType === 'Hackathon'}
              rows="4"
              placeholder="Describe the hackathon problem statement" />

            </div>
          </>
        }

        
        <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Notifications (Optional)</h2>
        <div className="form-group">
          <label>Discord Webhook URL</label>
          <input
            type="url"
            name="discordWebhook"
            value={formData.discordWebhook}
            onChange={handleChange}
            placeholder="Enter Discord webhook URL for notifications" />

          <small style={{ color: '#6c757d' }}>A notification will be sent when the event is published</small>
        </div>

        
        <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : editId ? 'Update Event' : 'Create Event'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/ongoing-events')}
            disabled={loading}>

            Cancel
          </button>
        </div>
      </form>
    </div>);

}

export default CreateEvent;
