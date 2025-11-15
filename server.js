// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const feedbackRoutes = require('./routes/feedback');
const basicAuth = require('./middleware/basicAuth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI not set in env');
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

// mount feedback route. Protect stats route with basicAuth (optional)
app.use('/api/feedback', feedbackRoutes);

// example: protect all /api/admin routes (if you add any)
app.use('/api/admin', basicAuth, (req, res) => {
  res.json({ ok: true, message: 'Admin area' });
});

// if you want to protect /api/stats specifically, you can change in routes to /api/feedback/stats or move it here

app.get('/', (req, res) => res.send('Feedback API running'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
