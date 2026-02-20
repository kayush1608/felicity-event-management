const nodemailer = require('nodemailer');

const getSmtpConfig = () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;

  return { host, port, user, pass, secure };
};

const requireSmtpConfig = () => {
  const cfg = getSmtpConfig();
  if (!cfg.host || !cfg.port || !cfg.user || !cfg.pass) {
    throw new Error('Missing EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD in environment');
  }
  return cfg;
};

let cachedTransporter = null;
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  const { host, port, user, pass, secure } = requireSmtpConfig();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return cachedTransporter;
};

const sendSmtpEmail = async ({ toEmail, subject, html, text, attachments }) => {
  const transporter = getTransporter();
  const { user } = requireSmtpConfig();

  return transporter.sendMail({
    from: user,
    to: toEmail,
    subject,
    html,
    text,
    attachments
  });
};

const parseDataUrlImage = (dataUrl) => {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
};

exports.sendTicketEmail = async (userEmail, eventName, ticketId, qrCode) => {
  try {
    const parsed = parseDataUrlImage(qrCode);

    const attachments = [];
    let qrImageHtml = '<p><em>QR code image may be blocked by your email client.</em></p>';
    let qrFallbackHtml = '<p><em>If you cannot see the QR, use the Ticket ID at check-in.</em></p>';

    if (parsed) {
      attachments.push({
        filename: 'ticket-qr.png',
        content: Buffer.from(parsed.base64, 'base64'),
        contentType: parsed.mimeType,
        cid: 'ticketqr'
      });

      qrImageHtml = '<img src="cid:ticketqr" alt="QR Code" style="max-width:320px; height:auto;" />';
      qrFallbackHtml = '<p><em>If the image is not visible, check the attachment <strong>ticket-qr.png</strong>.</em></p>';
    }

    await sendSmtpEmail({
      toEmail: userEmail,
      subject: `Event Registration Confirmed - ${eventName}`,
      html: `
        <h2>Registration Successful!</h2>
        <p>Thank you for registering for <strong>${eventName}</strong>.</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p>Please present this QR code at the event:</p>
        ${qrImageHtml}
        ${qrFallbackHtml}
        <p>See you at the event!</p>
      `,
      text: `Registration Successful! Event: ${eventName}. Ticket ID: ${ticketId}.`,
      attachments: attachments.length ? attachments : undefined
    });
  } catch (error) {
    console.error('❌ Error sending ticket email:', error?.message || error);
  }
};

exports.sendCredentialsEmail = async (userEmail, password, organizerName) => {
  try {
    await sendSmtpEmail({
      toEmail: userEmail,
      subject: 'Your Felicity Organizer Account Credentials',
      html: `
        <h2>Welcome to Felicity Event Management System</h2>
        <p>Dear ${organizerName},</p>
        <p>Your organizer account has been created successfully.</p>
        <p><strong>Login Email:</strong> ${userEmail}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
      text: `Organizer account created. Login: ${userEmail}. Temporary password: ${password}.`
    });
  } catch (error) {
    console.error('❌ Error sending credentials email:', error?.message || error);
  }
};

exports.sendPasswordResetEmail = async (userEmail, newPassword, organizerName) => {
  try {
    await sendSmtpEmail({
      toEmail: userEmail,
      subject: 'Password Reset - Felicity Event Management',
      html: `
        <h2>Password Reset Successful</h2>
        <p>Dear ${organizerName},</p>
        <p>Your password has been reset by the administrator.</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
      text: `Password reset. Login: ${userEmail}. New password: ${newPassword}.`
    });
  } catch (error) {
    console.error('❌ Error sending password reset email:', error?.message || error);
  }
};

exports._getSmtpConfig = getSmtpConfig;
exports._getTransporter = getTransporter;
exports._sendSmtpEmail = sendSmtpEmail;
