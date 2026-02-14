const router = require("express").Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { uploadNote, getNotes, deleteNote, downloadNote } = require("../controllers/noteController");

router.get("/", protect, getNotes);
router.post("/upload", protect, requireRole(["teacher"]), upload.single("file"), uploadNote);
router.get("/download/:filename", downloadNote); // Public download route (or add protect if needed)
router.delete("/:id", protect, requireRole(["teacher"]), deleteNote);

module.exports = router;
