const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User.model');

const usage = () => {
  console.log('Usage:');
  console.log('  node scripts/resetUserPassword.js <email> <newPassword>');
  console.log('Examples:');
  console.log('  node scripts/resetUserPassword.js user@gmail.com NewPass123');
};

async function main() {
  const args = process.argv.slice(2);

  const email = args[0];
  const newPassword = args[1];

  if (!email || !newPassword) {
    usage();
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exitCode = 1;
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Password reset for ${user.email} (role: ${user.role})`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Failed to reset password:', err.message);
  process.exit(1);
});
