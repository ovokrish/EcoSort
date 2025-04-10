import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config({ path: './.env.local' });

// Get current directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const PORT = 4000;

// Verify API key was loaded (show first 4 characters for security)
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  console.log(`API Key loaded: ${apiKey.substring(0, 4)}...`);
} else {
  console.error('API Key not found. Make sure GEMINI_API_KEY is in your .env.local file');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://127.0.0.1:8081', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to read image file
async function fileToGenerativePart(path) {
  try {
    console.log(`Reading file: ${path}`);
    const stats = await fs.promises.stat(path);
    console.log(`File size: ${stats.size} bytes`);



    
    
    const fileBuffer = await fs.promises.readFile(path);
    console.log(`File read successfully, buffer length: ${fileBuffer.length}`);
    
    return {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: 'image/jpeg' // Adjust mime type based on your needs
      }
    };
  } catch (err) {
    console.error(`Error reading file ${path}:`, err);
    throw err;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('Server is running. Send images to /analyze-image endpoint.');
});

// Handle image upload and analysis
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Get image path
    const imagePath = req.file.path;
    console.log(`Processing image: ${imagePath}`);
    
    // Optional prompt text from request
    const promptText = req.body.prompt || 'Describe this image in detail';
    console.log(`Using prompt: ${promptText.substring(0, 50)}...`);

    // Process with Gemini
    console.log(`Initializing Gemini model: gemini-1.5-flash`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log(`Reading image file...`);
    const imagePart = await fileToGenerativePart(imagePath);
    
    console.log(`Sending request to Gemini API...`);
    const result = await model.generateContent([
      promptText,
      imagePart
    ]);
    
    console.log(`Processing Gemini response...`);
    const response = await result.response;
    const text = response.text();
    
    // Clean up uploaded file (optional)
    fs.unlinkSync(imagePath);
    console.log(`Image analysis complete, file cleaned up.`);
    
    res.json({ analysis: text });
  } catch (error) {
    console.error('Error processing image:', error);
    // More detailed error logging
    if (error.response) {
      console.error('Gemini API response error:', error.response.data);
    }
    if (error.stack) {
      console.error('Error stack trace:', error.stack);
    }
    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Handle text questions about waste
app.post('/analyze-text', express.json(), async (req, res) => {
  const promptText = req.body.prompt;
  
  if (!promptText) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
  
  try {
    // Process with Gemini (text-only model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent([
      `Question about waste recycling or disposal: ${promptText}. Please provide detailed information about how to properly handle, recycle, or dispose of this type of waste. Include environmental impact and best practices.`
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    res.json({ analysis: text });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process text', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Remember to add "type": "module" to your package.json file