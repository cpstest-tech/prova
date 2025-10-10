import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../public/uploads');

// Crea directory se non esiste
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Whitelist estensioni permesse
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Controlla sia estensione che MIME type
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Estensione file non permessa. Consentite: ${allowedExtensions.join(', ')}`));
  }
  
  if (!allowedMimeTypes.includes(mimeType)) {
    return cb(new Error(`Tipo MIME non permesso. Consentiti: ${allowedMimeTypes.join(', ')}`));
  }

  // Sanitizza il nome file (rimuove caratteri pericolosi)
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  file.originalname = sanitizedName;

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1, // Max 1 file per volta
    fields: 10, // Max 10 campi
    parts: 20 // Max 20 parti totali
  },
  fileFilter: fileFilter
});
