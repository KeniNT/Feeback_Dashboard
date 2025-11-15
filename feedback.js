// routes/feedback.js
const express = require('express');
const router = express.Router();
const Feedback = require('../Models/Feedback');

// POST /api/feedback -> add feedback
router.post('/', async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;
    // Validation
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const fb = new Feedback({ name: name.trim(), email: email?.trim(), message: message.trim(), rating: ratingNum });
    await fb.save();
    res.status(201).json(fb);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/feedback -> fetch all (supports ?rating= and ?q=search)
router.get('/', async (req, res) => {
  try {
    const { rating, q, sort } = req.query;
    const filter = {};
    if (rating) filter.rating = Number(rating);
    if (q) {
      // search in name, email, message
      const re = new RegExp(q, 'i');
      filter.$or = [{ name: re }, { email: re }, { message: re }];
    }
    const sortOption = sort === 'asc' ? { createdAt: 1 } : { createdAt: -1 };
    const feedbacks = await Feedback.find(filter).sort(sortOption).limit(1000); // limit safeguard
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats -> analytics: avg rating, total, positive vs negative
router.get('/stats', async (req, res) => {
  try {
    // aggregation pipeline
    const agg = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          positive: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $lt: ['$rating', 3] }, 1, 0] } }
        }
      }
    ]);
    const stats = agg[0] || { total: 0, avgRating: 0, positive: 0, negative: 0 };
    res.json({
      total: stats.total,
      avgRating: Number((stats.avgRating || 0).toFixed(2)),
      positive: stats.positive,
      negative: stats.negative
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
