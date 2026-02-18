const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const User = require('../models/User.model');
const Registration = require('../models/Registration.model');
const Feedback = require('../models/Feedback.model');
const PasswordResetRequest = require('../models/PasswordResetRequest.model');
const Team = require('../models/Team.model');

const usage = () => {
  console.log('Usage:');
  console.log('  node scripts/deleteUser.js <email> [--force]');
  console.log('Examples:');
  console.log('  node scripts/deleteUser.js user@gmail.com');
  console.log('  node scripts/deleteUser.js user@gmail.com --force');
  console.log('Notes:');
  console.log('  - Without --force, admins cannot be deleted.');
  console.log('  - This deletes related registrations/feedback/reset-requests and removes team membership refs.');
};

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');

  if (!emailArg) {
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
    const email = emailArg.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exitCode = 1;
      return;
    }

    if (user.role === 'admin' && !force) {
      console.error('Refusing to delete an admin without --force');
      process.exitCode = 1;
      return;
    }

    const userId = user._id;


    const [regRes, fbRes, prrRes] = await Promise.all([
    Registration.deleteMany({ participantId: userId }),
    Feedback.deleteMany({ participantId: userId }),
    PasswordResetRequest.deleteMany({ organizerId: userId })]
    );


    const [teamsLedRes, teamsMemberRes] = await Promise.all([
    Team.deleteMany({ teamLeaderId: userId }),
    Team.updateMany(
      { 'members.userId': userId },
      { $pull: { members: { userId } } }
    )]
    );


    await User.deleteOne({ _id: userId });

    console.log(`✅ Deleted user ${email} (role: ${user.role})`);
    console.log(`- registrations deleted: ${regRes.deletedCount || 0}`);
    console.log(`- feedback deleted: ${fbRes.deletedCount || 0}`);
    console.log(`- password reset requests deleted: ${prrRes.deletedCount || 0}`);
    console.log(`- teams led deleted: ${teamsLedRes.deletedCount || 0}`);
    console.log(`- teams updated (member removed): ${teamsMemberRes.modifiedCount || 0}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Failed to delete user:', err.message);
  process.exit(1);
});
