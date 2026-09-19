const express = require('express');
const router = express.Router();
const { exportNotesToXML, exportSingleNoteXML } = require('../controllers/xmlController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/export', exportNotesToXML);
router.get('/notes/:id', exportSingleNoteXML);

module.exports = router;
