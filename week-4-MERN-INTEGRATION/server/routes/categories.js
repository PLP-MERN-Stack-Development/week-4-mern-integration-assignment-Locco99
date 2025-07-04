const express = require('express');
const { body } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) { next(err); }
});

// Create category
router.post(
  '/',
  auth,
  body('name').notEmpty(),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const category = new Category({ name });
      await category.save();
      res.status(201).json(category);
    } catch (err) { next(err); }
  }
);

module.exports = router; 