const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const fs = require("fs");

dotenv.config();
connectDB();

const app = express();

// Fix CORS - Allow multiple origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "https://notebook-render.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // allow main vercel domain + preview deployments
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true
}));


// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Uploads directory created: ${uploadsDir}`);
}

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Not Present');
  next();
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/colleges", require("./routes/collegeRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Notebook Backend Running...",
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin,
      isAllowed: allowedOrigins.includes(req.headers.origin)
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: "CORS Error",
      error: err.message,
      allowedOrigins: allowedOrigins,
      yourOrigin: req.headers.origin
    });
  }
  
  res.status(500).json({ 
    message: "Internal Server Error",
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});