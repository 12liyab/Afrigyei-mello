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

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// Serve frontend for all other routes (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'DVLA-record-full.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
