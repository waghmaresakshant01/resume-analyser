import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import resumeRouter from './routes/resume.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - allow all origins for Vercel compatibility
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) and all origins
    callback(null, true);
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Ensure uploads directory exists and serve static files
const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL === '1' ? '/tmp/uploads/' : 'uploads/');
const uploadPath = process.env.VERCEL === '1' ? uploadDir : path.resolve(__dirname, uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// Routes
app.use('/api/resume', resumeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Resume Analyzer API is healthy' });
});

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/resume-analyzer';
console.log('Connecting to MongoDB...');
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  });

export default app;
