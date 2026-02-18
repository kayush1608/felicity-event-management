const QRCode = require('qrcode');
const crypto = require('crypto');


exports.generateTicketId = () => {
  return 'TKT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
};


exports.generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};


exports.generateInviteCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};


exports.generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};
