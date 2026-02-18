const dotenv = require('dotenv');

dotenv.config();
const { app, ensureDbConnected } = require('./app');

const PORT = process.env.PORT || 5000;

ensureDbConnected().
then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).
catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;
