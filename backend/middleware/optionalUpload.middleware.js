const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'registrations');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDir(UPLOAD_ROOT);
    cb(null, UPLOAD_ROOT);
  },
  filename: function (req, file, cb) {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}_${safeBase}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});




function optionalUploadAny() {
  const handler = upload.any();
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) return next();

    handler(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Upload error'
        });
      }
      next();
    });
  };
}

module.exports = { optionalUploadAny };
