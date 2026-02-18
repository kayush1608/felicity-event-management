const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User.model');

const usage = () => {

  console.log('Usage:');
  console.log('  node scripts/resetAdminPassword.js <adminEmail?> <newPassword>');
  console.log('Examples:');
  console.log('  node scripts/resetAdminPassword.js admin@felicity.com NewPass123');
  console.log('  node scripts/resetAdminPassword.js NewPass123   (uses first admin user found)');
};

async function main() {
  const args = process.argv.slice(2);

  let adminEmail;
  let newPassword;

  if (args.length === 1) {
    newPassword = args[0];
  } else if (args.length >= 2) {
    adminEmail = args[0];
    newPassword = args[1];
  }

  if (!newPassword) {
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
    const query = adminEmail ?
    { email: adminEmail.toLowerCase().trim(), role: 'admin' } :
    { role: 'admin' };

    const admin = await User.findOne(query);

    if (!admin) {
      console.error(
        adminEmail ?
        `No admin found with email ${adminEmail}` :
        'No admin user found to reset'
      );
      process.exitCode = 1;
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    console.log(`✅ Admin password reset for ${admin.email}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Failed to reset admin password:', err.message);
  process.exit(1);
});
