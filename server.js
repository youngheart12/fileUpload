
// app.js
// console added are for debugger purpose

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Set up storage using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Enable CORS
app.use(cors());

// Middleware to serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Endpoint to check if the server is running
app.get('/ping', (req, res) => {
  res.send('Server is up and running!');
});

// Endpoint to upload a file
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(201).json({ message: 'File uploaded successfully', filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to list uploaded files
app.get('/files', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    const fileList = files.map((file) => {
      const stats = fs.statSync(path.join('uploads', file));
      return {
        name: file,
        size: stats.size,
        uploadDate: stats.mtime,
      };
    });
    res.json(fileList);
  });
});

// Endpoint to download a file
app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.download(filePath);
});

// Endpoint to delete a file
app.delete('/files/:filename', (req, res) => {
  let filename = req.params.filename;
  filename = decodeURIComponent(filename);
  filename = filename.replace(/['"]+$/, '');
  const filePath = path.join(uploadFolder, filename);

  console.log("Attempting to delete file:", filePath); // Log the file path
  
  // Check if the file exists before attempting to delete it
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filename} not found`);
    return res.status(404).json({ message: 'File not found' });
  }

  // Delete the file
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ message: 'Error deleting file' });
    }
    console.log(`File ${filename} deleted successfully`);
    res.json({ message: 'File deleted successfully' });
  });
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadFolder, filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  // Set Content-Disposition header to make the browser download the file
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Send the file
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      return res.status(500).json({ message: 'Error downloading file' });
    }
    console.log(`File ${filename} downloaded successfully`);
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
