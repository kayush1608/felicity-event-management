const dotenv = require('dotenv');

dotenv.config();

const { _getBrevoConfig, _sendBrevoEmail } = require('../utils/emailService');

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

  const cfg = _getBrevoConfig();
  console.log('Brevo config (masked):');
  console.log(`- BREVO_API_KEY: ${mask(cfg.apiKey)}`);
  console.log(`- BREVO_SENDER_EMAIL: ${cfg.senderEmail || '(missing)'}`);
  console.log(`- BREVO_SENDER_NAME: ${cfg.senderName || '(missing)'}`);
  console.log(`- BREVO_REPLY_TO_EMAIL: ${cfg.replyToEmail || '(optional)'}`);

  console.log(`Sending test email to ${to}...`);
  const result = await _sendBrevoEmail({
    toEmail: to,
    subject: 'Felicity EMS - Test Email',
    htmlContent: '<p>If you received this, Brevo API is configured correctly.</p>',
    textContent: 'If you received this, Brevo API is configured correctly.'
  });

  console.log('✅ Sent. Response:', result);
}

main().catch((err) => {
  console.error('❌ Test email failed:', err?.message || err);
  process.exit(1);
});
