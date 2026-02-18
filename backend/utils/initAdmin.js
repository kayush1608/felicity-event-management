const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  try {

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✅ Admin user already exists');
      return;
    }


    const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Please change the default password!');

  } catch (error) {
    console.error('❌ Error initializing admin:', error.message);
  }
};

module.exports = initAdmin;
