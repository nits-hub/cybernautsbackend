const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for all origins
app.use(cors());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/product_registration')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Define Schema for Product Registration
const productSchema = new mongoose.Schema({
  category: String,
  model: String,
  serialNumber: String,
  invoiceDate: Date,
  fileUpload: String,
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle POST request to register product
app.post('/register-product', upload.single('fileUpload'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('File not uploaded');
    }

    const { category, model, serialNumber, invoiceDate } = req.body;
    const fileUpload = req.file.path;

    const product = new Product({
      category,
      model,
      serialNumber,
      invoiceDate,
      fileUpload,
    });
    await product.save();
    res.json({ message: 'Product registered successfully!' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handling middleware for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    res.status(500).json({ message: 'Multer error occurred' });
  } else if (err) {
    console.error('Unknown error:', err);
    res.status(500).json({ message: 'An unknown error occurred' });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
