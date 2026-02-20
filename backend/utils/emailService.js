const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Felicity EMS';
  const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL;
  const replyToName = process.env.BREVO_REPLY_TO_NAME;

  return { apiKey, senderEmail, senderName, replyToEmail, replyToName };
};

const requireBrevoConfig = () => {
  const { apiKey, senderEmail, senderName, replyToEmail, replyToName } = getBrevoConfig();
  if (!apiKey || !senderEmail) {
    throw new Error('Missing BREVO_API_KEY/BREVO_SENDER_EMAIL in environment');
  }
  return { apiKey, senderEmail, senderName, replyToEmail, replyToName };
};

const safeReadResponseBody = async (res) => {
  try {
    const text = await res.text();
    if (!text) return '';
    return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
  } catch (e) {
    return '';
  }
};

const sendBrevoEmail = async ({ toEmail, subject, htmlContent, textContent, attachment, inlineImage }) => {
  const { apiKey, senderEmail, senderName, replyToEmail, replyToName } = requireBrevoConfig();

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail }],
    subject,
    htmlContent,
    textContent
  };

  if (replyToEmail) {
    payload.replyTo = {
      email: replyToEmail,
      name: replyToName || senderName
    };
  }

  if (Array.isArray(attachment) && attachment.length) payload.attachment = attachment;
  if (Array.isArray(inlineImage) && inlineImage.length) payload.inlineImage = inlineImage;

  const res = await fetch(BREVO_SEND_EMAIL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await safeReadResponseBody(res);
    throw new Error(`Brevo send failed (${res.status} ${res.statusText})${body ? `: ${body}` : ''}`);
  }

  return res.json().catch(() => ({}));
};


exports.sendTicketEmail = async (userEmail, eventName, ticketId, qrCode) => {
  try {
    const attachment = [];
    const inlineImage = [];
    let qrImageHtml = '<p><em>QR code image may be blocked by your email client.</em></p>';
    let qrFallbackHtml = '<p><em>If you cannot see the QR, use the Ticket ID at check-in.</em></p>';

    if (typeof qrCode === 'string' && qrCode.startsWith('data:image/')) {
      const match = qrCode.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Content = match[2];
        inlineImage.push({
          name: 'ticket-qr.png',
          content: base64Content,
          cid: 'ticketqr'
        });
        attachment.push({
          name: 'ticket-qr.png',
          content: base64Content
        });
        qrImageHtml = '<img src="cid:ticketqr" alt="QR Code" style="max-width:320px; height:auto;" />';
        qrFallbackHtml = '<p><em>If the image is not visible, download the attachment <strong>ticket-qr.png</strong>.</em></p>';
      } else {
        qrImageHtml = `<img src="${qrCode}" alt="QR Code" style="max-width:320px; height:auto;" />`;
      }
    }

    await sendBrevoEmail({
      toEmail: userEmail,
      subject: `Event Registration Confirmed - ${eventName}`,
      htmlContent: `
        <h2>Registration Successful!</h2>
        <p>Thank you for registering for <strong>${eventName}</strong>.</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p>Please present this QR code at the event:</p>
        ${qrImageHtml}
        ${qrFallbackHtml}
        <p>See you at the event!</p>
      `,
      textContent: `Registration Successful! Event: ${eventName}. Ticket ID: ${ticketId}.`,
      attachment,
      inlineImage
    });
  } catch (error) {
    console.error('❌ Error sending ticket email:', error?.message || error);
  }
};


exports.sendCredentialsEmail = async (userEmail, password, organizerName) => {
  try {
    await sendBrevoEmail({
      toEmail: userEmail,
      subject: 'Your Felicity Organizer Account Credentials',
      htmlContent: `
        <h2>Welcome to Felicity Event Management System</h2>
        <p>Dear ${organizerName},</p>
        <p>Your organizer account has been created successfully.</p>
        <p><strong>Login Email:</strong> ${userEmail}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
      textContent: `Organizer account created. Login: ${userEmail}. Temporary password: ${password}.`
    });
  } catch (error) {
    console.error('❌ Error sending credentials email:', error?.message || error);
  }
};


exports.sendPasswordResetEmail = async (userEmail, newPassword, organizerName) => {
  try {
    await sendBrevoEmail({
      toEmail: userEmail,
      subject: 'Password Reset - Felicity Event Management',
      htmlContent: `
        <h2>Password Reset Successful</h2>
        <p>Dear ${organizerName},</p>
        <p>Your password has been reset by the administrator.</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
      textContent: `Password reset. Login: ${userEmail}. New password: ${newPassword}.`
    });
  } catch (error) {
    console.error('❌ Error sending password reset email:', error?.message || error);
  }
};

exports._getBrevoConfig = getBrevoConfig;
exports._sendBrevoEmail = sendBrevoEmail;
