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
