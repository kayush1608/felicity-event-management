const dotenv = require('dotenv');

dotenv.config();

const { app, ensureDbConnected } = require('../app');

module.exports = async (req, res) => {
  try {
    await ensureDbConnected();
    return app(req, res);
  } catch (err) {
    console.error('Vercel function init error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server initialization failed'
    });
  }
};
