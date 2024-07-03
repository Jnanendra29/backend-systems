const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const authRouter = require('./auth');
const queueRouter = require('./queue');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.json());

// Authentication middleware
app.use('/auth', authRouter);

// Queue management middleware
app.use('/queue', authenticateUser, queueRouter);

// Middleware to authenticate user using JWT
function authenticateUser(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Authorization token is required' });

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => { // Fixed token extraction
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded.user;
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
