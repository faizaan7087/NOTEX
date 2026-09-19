const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getDashboardStats,
  getSubjects,
  syncAllNotesToDrive
} = require('../controllers/noteController');
const {
  exportNotesToXML,
  exportSingleNoteXML
} = require('../controllers/xmlController');
const { protect } = require('../middleware/authMiddleware');

// All note routes are protected by JWT authentication
router.use(protect);

// Specific routes before parametric :id routes
router.get('/stats/summary', getDashboardStats);
router.get('/export/xml', exportNotesToXML);
router.post('/sync-drive', syncAllNotesToDrive);

// CRUD routes
router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

router.get('/:id/xml', exportSingleNoteXML);

module.exports = router;
