import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadDir = path.join(__dirname, '..', '..', 'uploads');

// When Cloudinary is configured we buffer in memory then stream-upload;
// otherwise we write to local disk (handy for local dev).
function buildLocalStorage() {
  fs.mkdirSync(localUploadDir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, localUploadDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const storage = env.cloudinary.enabled ? multer.memoryStorage() : buildLocalStorage();

const ALLOWED = /jpeg|jpg|png|webp|gif|pdf/;

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const okExt = ALLOWED.test(path.extname(file.originalname).toLowerCase());
    const okMime = ALLOWED.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error('Only images and PDF files are allowed'));
  },
});

// Stream a buffered file to Cloudinary and resolve with the upload result.
function uploadBufferToCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'memokeep', resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Normalize a multer file into our Document fields, regardless of storage backend.
export async function fileToDocFields(file) {
  if (env.cloudinary.enabled) {
    const result = await uploadBufferToCloudinary(file.buffer, file.originalname);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storage: 'cloudinary',
    };
  }
  return {
    url: `/uploads/${file.filename}`,
    publicId: file.filename,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storage: 'local',
  };
}

export { localUploadDir };
