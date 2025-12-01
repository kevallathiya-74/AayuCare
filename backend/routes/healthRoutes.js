const express = require('express');
const router = express.Router();
const {
  createHealthRecord,
  getHealthRecords,
  getHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  addVitalSigns
} = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createHealthRecord);
router.post('/vitals', protect, addVitalSigns);
router.get('/', protect, getHealthRecords);
router.get('/:id', protect, getHealthRecord);
router.put('/:id', protect, updateHealthRecord);
router.delete('/:id', protect, deleteHealthRecord);

module.exports = router;
