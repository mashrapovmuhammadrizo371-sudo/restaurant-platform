const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.has(ext)) {
    return cb(new ApiError(400, 'Only image files are allowed (jpg, jpeg, png, webp, gif)'));
  }
  cb(null, true);
}

const maxSizeBytes = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeBytes }
});

// Returns the public URL path for a stored file name.
function filePublicUrl(filename) {
  if (!filename) return null;
  return `/uploads/${filename}`;
}

module.exports = { upload, filePublicUrl };
