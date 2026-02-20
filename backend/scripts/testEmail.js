const dotenv = require('dotenv');

dotenv.config();

const { _getSmtpConfig, _getTransporter, _sendSmtpEmail } = require('../utils/emailService');

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

  const cfg = _getSmtpConfig();
  console.log('SMTP config (masked):');
  console.log(`- EMAIL_HOST: ${cfg.host || '(missing)'}`);
  console.log(`- EMAIL_PORT: ${cfg.port || '(missing)'}`);
  console.log(`- EMAIL_USER: ${cfg.user || '(missing)'}`);
  console.log(`- EMAIL_PASSWORD: ${mask(cfg.pass)}`);
  console.log(`- EMAIL_SECURE: ${String(cfg.secure)}`);

  const transporter = _getTransporter();
  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('✅ SMTP verified');

  console.log(`Sending test email to ${to}...`);
  const result = await _sendSmtpEmail({
    toEmail: to,
    subject: 'Felicity EMS - Test Email',
    html: '<p>If you received this, SMTP is configured correctly.</p>',
    text: 'If you received this, SMTP is configured correctly.'
  });

  console.log('✅ Sent. Response:', result);
}

main().catch((err) => {
  console.error('❌ Test email failed:', err?.message || err);
  process.exit(1);
});
