require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins (adjust as needed)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://dvla-afrigyei.netlify.app/',
  methods: ['POST'],
  allowedHeaders: ['Content-Type'] // Allow only 'Content-Type' header
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Password hashing utility
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Define Mongoose schemas and models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }
});

const recordSchema = new mongoose.Schema({
  customerName: String,
  vehicleName: String,
  vehicleNumber: String,
  telephoneNumber: String,
  chassisNumber: String,
  pc: String,
  expiryDate: Date,
  status: { type: String, default: 'active' },
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length !== 4) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const passwordHash = hashPassword(password);
    const user = new User({ username, passwordHash });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length !== 4) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new vehicle record
app.post('/api/records', async (req, res) => {
  const recordData = req.body;
  try {
    const record = new Record(recordData);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Get all records (with optional filters)
app.get('/api/records', async (req, res) => {
  const { status, search, month } = req.query;
  let filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search) {
    filter.vehicleNumber = { $regex: search, $options: 'i' };
  }
  if (month && month !== 'all') {
    const monthNum = parseInt(month);
    filter.expiryDate = {
      $gte: new Date(new Date().getFullYear(), monthNum - 1, 1),
      $lt: new Date(new Date().getFullYear(), monthNum, 1)
    };
  }
  try {
    const records = await Record.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Update a record by ID
app.put('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const record = await Record.findByIdAndUpdate(id, updateData, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Delete (soft delete) a record by ID
app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const record = await Record.findByIdAndUpdate(id, { status: 'deleted' }, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record marked as deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
