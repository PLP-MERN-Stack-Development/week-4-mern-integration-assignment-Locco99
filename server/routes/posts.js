const express = require('express');
const { body } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Pagination, search, and get all posts
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const total = await Post.countDocuments();
    const posts = await Post.find()
      .skip(skip)
      .limit(limit)
      .populate('author', 'username')
      .populate('category');
    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// Get single post
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate('category')
      .populate('comments.user', 'username');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) { next(err); }
});

// Create post
router.post(
  '/',
  auth,
  body('title').notEmpty(),
  body('content').notEmpty(),
  async (req, res, next) => {
    try {
      const { title, content, category, image } = req.body;
      const post = new Post({ title, content, category, author: req.user.id, image });
      await post.save();
      res.status(201).json(post);
    } catch (err) { next(err); }
  }
);

// Edit post
router.put(
  '/:id',
  auth,
  body('title').optional().notEmpty(),
  body('content').optional().notEmpty(),
  async (req, res, next) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (err) { next(err); }
  }
);

// Delete post
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
});

// Image upload
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Add comment
router.post('/:id/comments', auth, body('text').notEmpty(), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ user: req.user.id, text: req.body.text });
    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) { next(err); }
});

module.exports = router; 