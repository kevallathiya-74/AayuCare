const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUsers,
  getUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, getUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
