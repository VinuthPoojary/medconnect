import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BUCKET_NAME = 'medical-reports';
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../uploads/medical-reports');

// Ensure local fallback storage directory exists
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

let isBucketReady = false;

/**
 * Initialize Private Storage Bucket in Supabase
 */
export const initStorageBucket = async () => {
  if (isBucketReady) return true;

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (!listError && buckets) {
      const exists = buckets.some(b => b.name === BUCKET_NAME);
      if (!exists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: false, // Strict Private Bucket: Access controlled via Signed URLs only
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 25 * 1024 * 1024, // 25MB
        });
        if (createError) {
          console.warn('⚠️ Supabase Storage bucket creation notice:', createError.message);
        } else {
          console.log(`🔒 Created private Supabase Storage bucket: "${BUCKET_NAME}"`);
        }
      } else {
        console.log(`🔒 Supabase Storage bucket "${BUCKET_NAME}" is verified and active (Private).`);
      }
      isBucketReady = true;
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Supabase Storage initialization note:', err.message);
  }
  return false;
};

// Initialize on module load
initStorageBucket().catch(() => {});

/**
 * Upload Medical Report File to Private Supabase Storage
 * File Organization: medical-reports/{patient_id}/{report_id}/{safe_filename}
 */
export const uploadReportFile = async ({ fileBuffer, mimeType, patientId, reportId, originalFilename }) => {
  const safeFilename = (originalFilename || 'report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageFilePath = `${patientId}/${reportId}/${safeFilename}`;

  // 1. Always maintain local resilient backup copy
  try {
    const localDir = path.join(LOCAL_STORAGE_DIR, patientId, reportId);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilePath = path.join(localDir, safeFilename);
    fs.writeFileSync(localFilePath, fileBuffer);
  } catch (fsErr) {
    console.warn('⚠️ Local file backup note:', fsErr.message);
  }

  // 2. Upload to Supabase Storage Private Bucket
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storageFilePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('⚠️ Supabase Storage upload error (falling back to local storage):', error.message);
    } else {
      console.log(`☁️ Successfully uploaded file to Supabase Storage: ${BUCKET_NAME}/${storageFilePath}`);
    }
  } catch (err) {
    console.warn('⚠️ Supabase Storage network upload notice:', err.message);
  }

  return {
    bucket: BUCKET_NAME,
    filePath: storageFilePath,
    fileName: safeFilename,
    fileSize: fileBuffer.length,
    fileType: mimeType,
  };
};

/**
 * Generate Temporary Signed URL for Authorized Viewing/Download (5-minute expiry)
 */
export const getSignedReportUrl = async (storageFilePath, expiresInSeconds = 300) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storageFilePath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('⚠️ Supabase createSignedUrl notice:', err.message);
  }

  // Fallback: Generate local secure temporary token stream URL
  const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
    .update(`${storageFilePath}:${Math.floor(Date.now() / (1000 * expiresInSeconds))}`)
    .digest('hex');

  return `/api/reports/secure-file?path=${encodeURIComponent(storageFilePath)}&token=${token}`;
};

/**
 * Retrieve File Buffer from Supabase Storage (or local storage fallback)
 */
export const getReportFileBuffer = async (storageFilePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storageFilePath);

    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.warn('⚠️ Supabase download notice:', err.message);
  }

  // Local fallback
  const localFilePath = path.join(LOCAL_STORAGE_DIR, storageFilePath);
  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath);
  }

  throw new Error(`Report document file not found at path: ${storageFilePath}`);
};

/**
 * Delete File from Private Supabase Storage & Local Filesystem
 */
export const deleteReportFile = async (storageFilePath) => {
  if (!storageFilePath) return true;

  try {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([storageFilePath]);
    console.log(`🗑️ Removed file from Supabase Storage: ${storageFilePath}`);
  } catch (err) {
    console.warn('⚠️ Supabase Storage remove notice:', err.message);
  }

  try {
    const localFilePath = path.join(LOCAL_STORAGE_DIR, storageFilePath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      // Clean up empty parent directory if possible
      const reportDir = path.dirname(localFilePath);
      if (fs.existsSync(reportDir) && fs.readdirSync(reportDir).length === 0) {
        fs.rmdirSync(reportDir);
      }
    }
  } catch (fsErr) {
    console.warn('⚠️ Local file delete notice:', fsErr.message);
  }

  return true;
};
