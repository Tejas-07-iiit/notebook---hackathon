const Note = require("../Models/Note.model");
const path = require("path");
const fs = require("fs").promises; // Use fs.promises
const fsSync = require("fs"); // Keep fsSync for constants or streams if needed (e.g. createReadStream)

exports.uploadNote = async (req, res) => {
  console.log("======= UPLOAD NOTE START =======");
  console.log("📤 Upload request received");

  try {
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📎 Uploaded file info:", req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      destination: req.file.destination
    } : 'NO FILE');

    console.log("👤 User making request:", req.user ? {
      _id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      collegeId: req.user.collegeId
    } : 'NO USER');

    // Check if file exists (Async)
    if (req.file && req.file.path) {
      try {
        await fs.access(req.file.path);
        console.log(`📁 File exists on disk at ${req.file.path}`);
      } catch (e) {
        console.log(`⚠️ File does NOT exist on disk at ${req.file.path}`);
      }
    }

    const { title, description, subject, department, semester, type, year, examType } = req.body;

    if (!req.file) {
      console.log("❌ ERROR: No file uploaded");
      return res.status(400).json({
        message: "File is required",
        details: "No file was uploaded"
      });
    }

    // Validate required fields
    console.log("🔍 Validating fields...");
    console.log("Title:", title, "| Exists:", !!title);
    console.log("Subject:", subject, "| Exists:", !!subject);
    console.log("Department:", department, "| Exists:", !!department);
    console.log("Semester:", semester, "| Exists:", !!semester);

    if (!title || !subject || !department || !semester) {
      console.log("❌ ERROR: Missing required fields");

      // Delete the uploaded file if validation fails
      if (req.file.path) {
        console.log("🗑️ Deleting uploaded file due to validation failure...");
        try {
          await fs.unlink(req.file.path);
          console.log("✅ File deleted successfully");
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }

      return res.status(400).json({
        message: "Title, subject, department, and semester are required",
        missing: {
          title: !title,
          subject: !subject,
          department: !department,
          semester: !semester
        }
      });
    }

    console.log("✅ All validations passed");

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log("🔗 File URL for access:", fileUrl);

    console.log("💾 Creating note in database...");
    const note = await Note.create({
      title,
      description: description || "",
      subject,
      department,
      semester: Number(semester),
      type: type || "note",
      year: year ? Number(year) : null,
      examType: examType || "other",
      fileUrl,
      uploadedBy: req.user._id,
      collegeId: req.user.collegeId
    });

    console.log("✅ Note created successfully with ID:", note._id);
    console.log("📊 Note details:", {
      id: note._id,
      title: note.title,
      subject: note.subject,
      fileUrl: note.fileUrl
    });

    console.log("======= UPLOAD NOTE SUCCESS =======");

    res.status(201).json({
      message: "Note uploaded successfully",
      note,
      fileUrl: `${req.protocol}://${req.get('host')}${fileUrl}` // Return full URL dynamically
    });

  } catch (err) {
    console.error("❌ ======= UPLOAD NOTE ERROR =======");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error stack:", err.stack);

    if (err.name === 'ValidationError') {
      console.error("Mongoose validation errors:", err.errors);
    }

    if (err.name === 'MongoError') {
      console.error("MongoDB error code:", err.code);
    }

    console.error("Full error object:", JSON.stringify(err, null, 2));
    console.error("======= UPLOAD NOTE END =======");

    // Delete the uploaded file if there's an error
    if (req.file && req.file.path) {
      console.log("🗑️ Attempting to delete uploaded file after error...");
      try {
        await fs.unlink(req.file.path);
        console.log("✅ File deleted after error");
      } catch (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      }
    }

    res.status(500).json({
      message: "Error uploading note",
      error: err.message,
      errorType: err.name,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

exports.getNotes = async (req, res) => {
  try {
    console.log("📥 Get notes request");
    console.log("Query parameters:", req.query);
    console.log("User collegeId:", req.user.collegeId);

    const { search, college, department, semester, subject, type, year, examType } = req.query;

    let filter = {};

    // If college query is passed use it else use user's college
    filter.collegeId = college ? college : req.user.collegeId;
    console.log("Using collegeId filter:", filter.collegeId);

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (subject) filter.subject = subject;
    if (type) filter.type = type;
    if (year) filter.year = Number(year);
    if (examType) filter.examType = examType;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    console.log("Final filter:", JSON.stringify(filter, null, 2));

    const notes = await Note.find(filter)
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${notes.length} notes`);
    res.json(notes);

  } catch (err) {
    console.error("❌ Get notes error:", err);
    res.status(500).json({
      message: "Error fetching notes",
      error: err.message
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    console.log("🗑️ Delete note request for ID:", req.params.id);

    const note = await Note.findById(req.params.id);

    if (!note) {
      console.log("❌ Note not found");
      return res.status(404).json({ message: "Note not found" });
    }

    console.log("Found note:", {
      id: note._id,
      title: note.title,
      uploadedBy: note.uploadedBy,
      currentUser: req.user._id,
      currentUserRole: req.user.role
    });

    // Check permission
    if (req.user.role !== "teacher") {
      console.log("❌ User not authorized to delete");
      return res.status(403).json({ message: "Not authorized to delete notes" });
    }

    console.log("✅ User authorized to delete");

    // Delete the file from uploads directory
    if (note.fileUrl) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      console.log("Looking for file at:", filePath);

      try {
        await fs.access(filePath);
        console.log("✅ File exists, deleting...");
        await fs.unlink(filePath);
        console.log("✅ File deleted:", filePath);
      } catch (err) {
        console.log("⚠️ File not found at path or cannot delete:", filePath);
      }
    } else {
      console.log("⚠️ No fileUrl in note");
    }

    await note.deleteOne();
    console.log("✅ Note deleted from database");

    res.json({ message: "Note deleted successfully" });

  } catch (err) {
    console.error("❌ Delete note error:", err);
    res.status(500).json({
      message: "Error deleting note",
      error: err.message
    });
  }
};

exports.downloadNote = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Security check: ensure path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(__dirname, '..', 'uploads');
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      await fs.access(filePath);
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error downloading file" });
          }
        }
      });
    } catch (err) {
      console.error("File not found for download:", filePath);
      res.status(404).json({ message: "File not found" });
    }

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Server error" });
  }
};