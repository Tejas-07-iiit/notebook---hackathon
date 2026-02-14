const multer = require("multer");
const path = require("path");
const fs = require("fs");

console.log("📁 Setting up upload middleware...");

// Create uploads directory if it doesn't exist
const uploadDir = "uploads";
const fullPath = path.join(__dirname, '..', uploadDir);
console.log("Upload directory path:", fullPath);

if (!fs.existsSync(fullPath)) {
  console.log("📂 Creating uploads directory...");
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log("✅ Uploads directory created:", fullPath);
  } catch (err) {
    console.error("❌ Failed to create uploads directory:", err);
  }
} else {
  console.log("✅ Uploads directory exists");
  console.log("Directory contents:", fs.readdirSync(fullPath));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("💾 Saving file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = uniqueName + extension;
    console.log("📄 Generated filename:", filename, "for original:", file.originalname);
    cb(null, filename);
  }
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

console.log("✅ Upload middleware configured for local storage");

module.exports = upload;