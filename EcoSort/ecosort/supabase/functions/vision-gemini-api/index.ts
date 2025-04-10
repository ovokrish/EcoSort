import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// TODO: Remove hardcoded keys before production deployment
// const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') || "AIzaSyAFNvWiPragShvffVJO4-KKsHnq8n3ejBU";
const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

interface RequestBody {
  image?: string;
  prompt?: string;
  includeProductDetection?: boolean;
  isManualClassification?: boolean;
  testOnly?: boolean;
  skipVisionAPI?: boolean;
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Check if Gemini API key is available
    if (!GOOGLE_GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { image, prompt, isManualClassification } = requestData;

    // Handle manual classification request (only prompt, no image)
    if (isManualClassification && prompt) {
      return await handleManualClassification(prompt, corsHeaders);
    }

    // Handle image-based classification
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove data URI prefix if present
    const imageBase64 = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    // Use direct Gemini image classification
    return await handleDirectGeminiClassification(imageBase64, corsHeaders);

    /* COMMENTED OUT: All Vision API code
    // Check if API keys are available
    if (requestData.skipVisionAPI) {
      // Skip Vision API check when direct Gemini classification is requested
      if (!GOOGLE_GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Google Gemini API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!GOOGLE_VISION_API_KEY || !GOOGLE_GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: !GOOGLE_VISION_API_KEY 
            ? 'Google Vision API key not configured' 
            : 'Google Gemini API key not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Call Google Vision API
    const visionApiEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
    
    // Handle test case with simplified Vision API call
    if (testOnly) {
      const testVisionRequest = {
        requests: [
          {
            image: {
              content: imageBase64
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 5
              }
            ]
          }
        ]
      };

      const testVisionResponse = await fetch(visionApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testVisionRequest)
      });

      const testVisionData = await testVisionResponse.json();

      if (!testVisionResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Vision API test failed', 
            details: testVisionData 
          }),
          { status: testVisionResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          labels: testVisionData.responses?.[0]?.labelAnnotations || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Call Google Vision API
    const visionRequest = {
      requests: [
        {
          image: {
            content: imageBase64
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 20
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            },
            {
              type: 'LOGO_DETECTION',
              maxResults: 5
            },
            {
              type: 'TEXT_DETECTION',
              maxResults: 5
            }
          ]
        }
      ]
    };

    // Call Google Vision API
    const visionResponse = await fetch(visionApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visionRequest)
    });

    const visionData = await visionResponse.json();

    // Process Google Vision API response
    if (visionData.error) {
      return new Response(
        JSON.stringify({ error: visionData.error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract labels, objects, logos, and text
    const result = visionData.responses[0];
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    const logos = result.logoAnnotations || [];
    const textAnnotations = result.textAnnotations || [];

    // Extract product information
    let productInfo = '';
    
    if (includeProductDetection) {
      // Combine logo detection and text recognition for product info
      if (logos && logos.length > 0) {
        productInfo += `Brand detected: ${logos.map((logo: any) => logo.description).join(', ')}. `;
      }
      
      // Extract text that might indicate product details
      if (textAnnotations && textAnnotations.length > 0) {
        // Get first 3 text items, which often have brand/product information
        const productText = textAnnotations.slice(0, 3).map((text: any) => text.description).join(' ');
        if (productText) {
          productInfo += `Text on product: ${productText}. `;
        }
      }
    }

    // Create a summary of what was detected
    const topLabels = labels.slice(0, 5).map((label: any) => label.description).join(', ');
    const topObjects = objects.slice(0, 3).map((obj: any) => obj.name).join(', ');

    // Step 2: Use Gemini API to get detailed waste disposal information
    const geminiApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    
    const detectedItems = [...objects.map((o: any) => o.name), ...labels.slice(0, 5).map((l: any) => l.description)];
    const uniqueItems = Array.from(new Set(detectedItems)).join(', ');
    
    const geminiPrompt = `
    I've detected the following items in an image: ${uniqueItems}.
    ${productInfo ? `Additional product information: ${productInfo}` : ''}

    Based on these items, please provide me with:
    1. The most likely waste type category (plastic, paper, glass, metal, organic, e-waste, or other)
    2. Whether it's recyclable or not
    3. A brief but detailed explanation (2-3 sentences) of how to properly dispose of this item
    4. Environmental impact (1-2 sentences)
    5. 1-2 specific tips for reducing waste of this type
    ${productInfo ? '6. The specific product name based on the detected information' : ''}

    Format your response as a structured JSON with the following fields:
    {
      "type": "waste type",
      "recyclable": boolean,
      "disposalMethod": "detailed disposal instructions",
      "impact": "environmental impact statement",
      "tips": "waste reduction tips",
      ${productInfo ? '"productName": "identified product name",' : ''}
      "fullResponse": "provide a comprehensive guidance paragraph here for disposal and recycling tips"
    }
    
    Don't include any text outside of the valid JSON object.
    `;

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: geminiPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800
      }
    };

    // Call Gemini API
    const geminiResponse = await fetch(`${geminiApiEndpoint}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    const geminiData = await geminiResponse.json();

    let wasteInfo = null;
    let error = null;

    if (geminiData.error) {
      error = geminiData.error.message;
      console.error('Gemini API error:', error);
    } else {
      try {
        // Extract the JSON response from the Gemini text output
        const geminiText = geminiData.candidates[0].content.parts[0].text;
        // Find the JSON object within the text (between { and })
        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          wasteInfo = JSON.parse(jsonMatch[0]);
        } else {
          error = "Could not parse Gemini response into JSON";
        }
      } catch (parseError) {
        error = `Error parsing Gemini response: ${parseError.message}`;
        console.error(error);
      }
    }

    return new Response(
      JSON.stringify({
        labels,
        objects,
        logos,
        textAnnotations: textAnnotations.slice(0, 5),
        wasteInfo,
        error,
        visionSummary: {
          topLabels,
          topObjects
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    */
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});

// Handle manual classification requests using Gemini
async function handleManualClassification(prompt: string, corsHeaders: Record<string, string>) {
  try {
    const geminiApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    
    const geminiPrompt = `
    I want to know how to properly dispose of the following waste item: ${prompt}

    Please analyze this description and provide detailed waste disposal guidance.
    Include the following information:
    1. The most likely waste type category (plastic, paper, glass, metal, organic, e-waste, or other)
    2. Whether it's recyclable or not
    3. A detailed explanation of how to properly dispose of this item
    4. Environmental impact of improper disposal
    5. Specific tips for reducing this type of waste
    6. Any special considerations or warnings

    Format your response as a structured JSON with the following fields:
    {
      "type": "waste type",
      "recyclable": boolean,
      "disposalMethod": "detailed disposal instructions",
      "impact": "environmental impact statement",
      "tips": "waste reduction tips",
      "fullResponse": "comprehensive guidance paragraph explaining all details about disposal, recycling, and environmental impact"
    }
    
    Don't include any text outside of the valid JSON object.
    `;

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: geminiPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000
      }
    };

    // Call Gemini API
    const geminiResponse = await fetch(`${geminiApiEndpoint}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    const geminiData = await geminiResponse.json();

    let wasteInfo = null;
    let error = null;

    if (geminiData.error) {
      error = geminiData.error.message;
      console.error('Gemini API error:', error);
    } else {
      try {
        // Extract the JSON response from the Gemini text output
        const geminiText = geminiData.candidates[0].content.parts[0].text;
        // Find the JSON object within the text (between { and })
        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          wasteInfo = JSON.parse(jsonMatch[0]);
        } else {
          error = "Could not parse Gemini response into JSON";
        }
      } catch (parseError) {
        error = `Error parsing Gemini response: ${parseError.message}`;
        console.error(error);
      }
    }

    return new Response(
      JSON.stringify({
        wasteInfo,
        error,
        isManualClassification: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Manual classification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// Add new function to handle direct image classification with Gemini
async function handleDirectGeminiClassification(imageBase64: string, corsHeaders: Record<string, string>) {
  try {
    const geminiApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    
    // Create a prompt for direct image classification
    const geminiPrompt = `
    I have an image of a waste item.
    
    Please analyze this image and provide detailed waste disposal guidance.
    Include the following information:
    1. The most likely waste type category (plastic, paper, glass, metal, organic, e-waste, or other)
    2. The specific object or item shown in the image (be as specific as possible)
    3. Whether it's recyclable or not
    4. A detailed explanation of how to properly dispose of this item
    5. Environmental impact of improper disposal
    6. Specific tips for reducing this type of waste
    
    Format your response as a structured JSON with the following fields:
    {
      "type": "waste type",
      "objectName": "specific object identified",
      "confidence": number between 0 and 1,
      "recyclable": boolean,
      "recyclability": "details about recyclability",
      "disposalMethod": "detailed disposal instructions",
      "impact": "environmental impact statement",
      "tips": "waste reduction tips",
      "fullResponse": "comprehensive guidance paragraph explaining all details about disposal, recycling, and environmental impact"
    }
    
    Don't include any text outside of the valid JSON object.
    `;

    // Gemini request payload with the image
    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: geminiPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    };

    // Call Gemini API with image
    const geminiResponse = await fetch(`${geminiApiEndpoint}?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    const geminiData = await geminiResponse.json();

    let wasteInfo = null;
    let error = null;

    if (geminiData.error) {
      error = geminiData.error.message;
      console.error('Gemini API error:', error);
    } else {
      try {
        // Extract the JSON response from the Gemini text output
        const geminiText = geminiData.candidates[0].content.parts[0].text;
        // Find the JSON object within the text (between { and })
        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          wasteInfo = JSON.parse(jsonMatch[0]);
        } else {
          error = "Could not parse Gemini response into JSON";
        }
      } catch (parseError) {
        error = `Error parsing Gemini response: ${parseError.message}`;
        console.error(error);
      }
    }

    return new Response(
      JSON.stringify({
        wasteInfo,
        error,
        directClassification: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Direct Gemini classification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
