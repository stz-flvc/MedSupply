import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import fs from "fs";

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isProduction = process.env.NODE_ENV === "production" || !!process.env.CLOUDINARY_CLOUD_NAME;

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: "medsupply",
        resource_type: "auto",
        public_id: Date.now() + "-" + Math.round(Math.random() * 1e9),
      };
    },
  });
} else {
  // Local storage for development, but warn in production
  const uploadDir = "uploads";
  if (process.env.NODE_ENV === "production") {
    console.error("WARNING: Using local storage in production! This will fail on Vercel.");
  }
  
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir);
    } catch (err) {
      console.error("Failed to create uploads directory:", err);
    }
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP and PDF files are allowed"));
    }
  },
});

router.post("/upload", (req, res, next) => {
  if (process.env.NODE_ENV === "production" && !process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(503).json({ 
      error: "Cloud storage is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your Vercel Environment Variables." 
    });
  }
  
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Cloudinary uses 'path' or 'secure_url', local multer uses 'filename'
    const fileUrl = (req.file as any).path || (req.file as any).secure_url || `/api/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

export default router;
