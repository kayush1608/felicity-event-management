const dotenv = require('dotenv');

dotenv.config();

const { _getTransporter } = require('../utils/emailService');

const usage = () => {
  console.log('Usage:');
  console.log('  node scripts/testEmail.js <toEmail>');
  console.log('Examples:');
  console.log('  node scripts/testEmail.js ayushkanani16@gmail.com');
};

const mask = (value) => {
  if (!value) return '(missing)';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
};

async function main() {
  const to = process.argv[2];
  if (!to) {
    usage();
    process.exit(1);
  }

  console.log('Email config (masked):');
  console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST || '(missing)'}`);
  console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT || '(missing)'}`);
  console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || '(missing)'}`);
  console.log(`- EMAIL_PASSWORD: ${mask(process.env.EMAIL_PASSWORD)}`);
  console.log(`- EMAIL_SECURE: ${process.env.EMAIL_SECURE || '(auto)'}`);
  console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || '(defaults to EMAIL_USER)'}`);

  const transporter = _getTransporter();

  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('✅ SMTP verify OK');

  console.log(`Sending test email to ${to}...`);
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Felicity EMS - Test Email',
    text: 'If you received this, SMTP is configured correctly.'
  });

  console.log('✅ Sent. MessageId:', info.messageId);
}

main().catch((err) => {
  console.error('❌ Test email failed:', err?.message || err);
  process.exit(1);
});
