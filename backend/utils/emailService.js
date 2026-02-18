const nodemailer = require('nodemailer');

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
};

const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !process.env.EMAIL_PORT || !user || !pass) {
    throw new Error('Missing EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD in backend/.env');
  }
  if (!Number.isFinite(port)) {
    throw new Error('EMAIL_PORT must be a number');
  }

  const secureOverride = parseBoolean(process.env.EMAIL_SECURE);
  const secure = secureOverride !== undefined ? secureOverride : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};


exports.sendTicketEmail = async (userEmail, eventName, ticketId, qrCode) => {
  try {
    const transporter = getTransporter();

    const attachments = [];
    let qrImageHtml = '<p><em>QR code image may be blocked by your email client.</em></p>';
    let qrFallbackHtml = '<p><em>If you cannot see the QR, use the Ticket ID at check-in.</em></p>';

    if (typeof qrCode === 'string' && qrCode.startsWith('data:image/')) {
      const match = qrCode.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Content = match[2];
        attachments.push({
          filename: 'ticket-qr.png',
          content: base64Content,
          encoding: 'base64',
          cid: 'ticketqr',
          contentType: mimeType,
          contentDisposition: 'inline'
        });

        attachments.push({
          filename: 'ticket-qr.png',
          content: base64Content,
          encoding: 'base64',
          contentType: mimeType,
          contentDisposition: 'attachment'
        });
        qrImageHtml = '<img src="cid:ticketqr" alt="QR Code" style="max-width:320px; height:auto;" />';
        qrFallbackHtml = '<p><em>If the image is not visible, download the attachment <strong>ticket-qr.png</strong>.</em></p>';
      } else {
        qrImageHtml = `<img src="${qrCode}" alt="QR Code" style="max-width:320px; height:auto;" />`;
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
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
      attachments
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending ticket email:', error?.message || error);
  }
};


exports.sendCredentialsEmail = async (userEmail, password, organizerName) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Your Felicity Organizer Account Credentials',
      html: `
        <h2>Welcome to Felicity Event Management System</h2>
        <p>Dear ${organizerName},</p>
        <p>Your organizer account has been created successfully.</p>
        <p><strong>Login Email:</strong> ${userEmail}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending credentials email:', error?.message || error);
  }
};


exports.sendPasswordResetEmail = async (userEmail, newPassword, organizerName) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Password Reset - Felicity Event Management',
      html: `
        <h2>Password Reset Successful</h2>
        <p>Dear ${organizerName},</p>
        <p>Your password has been reset by the administrator.</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error?.message || error);
  }
};


exports._getTransporter = getTransporter;
