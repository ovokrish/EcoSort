import { NextApiRequest, NextApiResponse } from 'next';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Vision API client
const visionClient = new ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}')
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, testOnly } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // For test requests, only verify the API connection
    if (testOnly) {
      try {
        // Test Vision API
        const [result] = await visionClient.labelDetection({
          image: { content: base64Image }
        });
        
        // Test Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        const prompt = "What is this?";
        const imageData = {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        };
        
        await model.generateContent([prompt, imageData]);
        
        return res.status(200).json({ 
          success: true,
          message: 'API test successful',
          labels: result.labelAnnotations?.map(label => label.description)
        });
      } catch (error) {
        console.error('API test failed:', error);
        return res.status(500).json({ 
          error: 'API test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // For actual classification requests, proceed with full analysis
    // ... existing classification code ...

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 