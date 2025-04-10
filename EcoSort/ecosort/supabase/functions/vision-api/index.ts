// Supabase Edge Function for Google Vision and Gemini API Proxy
// @deno-types="npm:@types/node"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Environment variables should be set in Supabase dashboard
const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

interface WasteInfo {
  classification: string;
  confidence: number;
  recyclable: boolean;
  disposal: string;
  environmental_impact: string;
  tips: string;
  specific_guidelines: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client (not used in this example but may be needed for auth verification)
    const supabase = createClient(
      SUPABASE_URL || '',
      SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get request data
    const data = await req.json()

    if (data.image) {
      // Handle image classification
      const imageBase64 = data.image.replace(/^data:image\/\w+;base64,/, '')
      
      // Step 1: Use Google Vision API to detect objects
      const visionResult = await callGoogleVisionAPI(imageBase64)
      
      // Step 2: Use Gemini API to classify waste based on Vision results
      const wasteInfo = await classifyWasteWithGemini(visionResult)
      
      return new Response(
        JSON.stringify(wasteInfo),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (data.prompt) {
      // Handle text prompts for Gemini
      const geminiResponse = await callGeminiAPI(data.prompt)
      
      return new Response(
        JSON.stringify(geminiResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'No image or prompt provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Function to call Google Vision API
async function callGoogleVisionAPI(imageBase64: string) {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error('GOOGLE_VISION_API_KEY is not set')
  }

  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`
  
  const requestData = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'OBJECT_LOCALIZATION',
            maxResults: 10
          },
          {
            type: 'LABEL_DETECTION',
            maxResults: 10
          }
        ]
      }
    ]
  }

  const response = await fetch(visionApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Vision API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

// Function to classify waste with Gemini
async function classifyWasteWithGemini(visionResult: any): Promise<WasteInfo> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  // Extract object and label data from Vision API result
  const objects = visionResult.responses[0]?.localizedObjectAnnotations || []
  const labels = visionResult.responses[0]?.labelAnnotations || []
  
  // Create a prompt for Gemini with the detected objects and labels
  const objectNames = objects.map((obj: any) => `${obj.name} (${Math.round(obj.score * 100)}% confidence)`).join(', ')
  const labelNames = labels.map((label: any) => `${label.description} (${Math.round(label.score * 100)}% confidence)`).join(', ')
  
  const prompt = `
    Based on the following objects and labels detected in an image, classify this item for waste disposal:
    
    Detected objects: ${objectNames || 'None'}
    Detected labels: ${labelNames || 'None'}
    
    Provide a structured response with the following information:
    1. What type of waste is this (plastic, paper, metal, glass, organic, electronic, hazardous, or other)?
    2. Is it recyclable? (true/false)
    3. What is the proper disposal method?
    4. What is its environmental impact?
    5. Any tips for reducing waste of this type?
    6. Specific guidelines for this type of waste in recycling programs.
    
    Format the response as a JSON object with the following keys:
    {
      "classification": string,
      "confidence": number (between 0 and 1),
      "recyclable": boolean,
      "disposal": string,
      "environmental_impact": string,
      "tips": string,
      "specific_guidelines": string
    }
  `

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`
  
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024
    }
  }

  const response = await fetch(geminiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${errorText}`)
  }

  const geminiResponse = await response.json()
  
  // Extract the JSON response from Gemini text
  try {
    const responseText = geminiResponse.candidates[0].content.parts[0].text
    // Find the JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const wasteInfo = JSON.parse(jsonMatch[0])
      return wasteInfo
    } else {
      // If no JSON found, create a fallback response
      return {
        classification: "unknown",
        confidence: 0.1,
        recyclable: false,
        disposal: "Cannot determine proper disposal method.",
        environmental_impact: "Unknown environmental impact.",
        tips: "Consider consulting local waste management guidelines.",
        specific_guidelines: "Unable to provide specific guidelines."
      }
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    throw new Error('Failed to parse waste classification information')
  }
}

// Function to call Gemini API directly with a prompt
async function callGeminiAPI(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`
  
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024
    }
  }

  const response = await fetch(geminiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${errorText}`)
  }

  const geminiResponse = await response.json()
  return {
    text: geminiResponse.candidates[0].content.parts[0].text
  }
}
