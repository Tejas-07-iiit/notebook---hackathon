const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

console.log("📁 Setting up upload middleware with Cloudinary...");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "notebook-uploads", // Folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    resource_type: "auto", // Handle raw files like PDF
  },
});

const fileFilter = (req, file, cb) => {
  console.log("🔍 Filtering file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    console.log("❌ File type not allowed:", file.mimetype);
    return cb(new Error("Only PDF and Images allowed"), false);
  }
  console.log("✅ File type allowed");
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log("✅ Upload middleware configured for Cloudinary");

module.exports = upload;