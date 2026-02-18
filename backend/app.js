const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const participantRoutes = require('./routes/participant.routes');
const organizerRoutes = require('./routes/organizer.routes');
const adminRoutes = require('./routes/admin.routes');
const eventRoutes = require('./routes/event.routes');

const app = express();

const backendPort = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedFromEnv = (process.env.FRONTEND_URL || 'http://localhost:3000').
      split(',').
      map((s) => s.trim()).
      filter(Boolean);

      const selfOrigins = [
      `http://localhost:${backendPort}`,
      `http://127.0.0.1:${backendPort}`];


      const allowed = [...new Set([...allowedFromEnv, ...selfOrigins])];

      if (!origin) return callback(null, true);

      if (allowed.includes(origin)) return callback(null, true);
      return callback(
        new Error(
          `Not allowed by CORS (origin: ${origin}). Allowed: ${allowed.join(', ')}`
        )
      );
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Felicity Event Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      participant: '/api/participant',
      organizer: '/api/organizer',
      admin: '/api/admin',
      events: '/api/events',
      health: '/api/health'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

let dbReadyPromise;
async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) return;
  if (!dbReadyPromise) {
    dbReadyPromise = mongoose.
    connect(process.env.MONGODB_URI).
    then(async () => {
      const initAdmin = require('./utils/initAdmin');
      await initAdmin();
    }).
    catch((err) => {
      dbReadyPromise = null;
      throw err;
    });
  }
  await dbReadyPromise;
}

module.exports = { app, ensureDbConnected };
