// src/services/wasteClassification.ts
import axios from 'axios';

export type WasteClassificationResult = {
  wasteType: string;
  objectName: string;
  confidence: number;
  details: {
    recyclability: string;
    disposalMethod: string;
    environmentalImpact: string;
    tips: string;
    specificGuidelines: string;
  };
  rawAnalysis?: string;
};

/**
 * Sends the captured image to the backend API for waste classification
 * @param {string} imageData - The base64 encoded image data
 * @returns {Promise<WasteClassificationResult>} - The classification result from the API
 */
export const classifyWasteImage = async (imageData: string): Promise<WasteClassificationResult> => {
  try {
    // Extract base64 data from the data URL if it's in that format
    let base64Data = imageData;
    if (imageData.startsWith('data:image')) {
      base64Data = imageData.split(',')[1];
    }

    // Convert base64 string to a Blob
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    const byteArray = new Uint8Array(byteArrays);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // Create form data to send the image
    const formData = new FormData();
    formData.append('image', blob, 'waste-image.jpg');
    formData.append('prompt', 'Analyze this image and classify the waste item. Identify what material it is made of (plastic, paper, glass, metal, organic, etc.) and whether it is recyclable. Provide details on proper disposal methods, environmental impact, and any specific recycling guidelines.');
    
    // Send the request to your Node.js backend
    const response = await axios.post('http://localhost:4000/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Process and return the response
    if (response.data && response.data.analysis) {
      return processGeminiResponse(response.data.analysis);
    } else {
      throw new Error('Invalid response from classification service');
    }
  } catch (error: any) {
    console.error('Classification API error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to classify image'
    );
  }
};

/**
 * Process the raw text response from Gemini API into structured data
 * @param {string} analysisText - The raw analysis text from Gemini
 * @returns {WasteClassificationResult} - Structured classification object
 */
function processGeminiResponse(analysisText: string): WasteClassificationResult {
  // This is a simplified implementation
  // You'll need to adapt based on how Gemini formats its response
  
  let wasteType = 'Unknown';
  let objectName = 'Unknown Object';
  let confidence = 0.5;
  
  // Extract waste type
  const lowerText = analysisText.toLowerCase();
  
  if (lowerText.includes('plastic')) {
    wasteType = 'Plastic';
    confidence += 0.2;
  } else if (lowerText.includes('paper') || lowerText.includes('cardboard')) {
    wasteType = 'Paper';
    confidence += 0.2;
  } else if (lowerText.includes('glass')) {
    wasteType = 'Glass';
    confidence += 0.2;
  } else if (lowerText.includes('metal') || lowerText.includes('aluminum') || lowerText.includes('tin')) {
    wasteType = 'Metal';
    confidence += 0.2;
  } else if (lowerText.includes('organic') || lowerText.includes('food')) {
    wasteType = 'Organic';
    confidence += 0.2;
  } else if (lowerText.includes('electronic') || lowerText.includes('e-waste')) {
    wasteType = 'E-Waste';
    confidence += 0.2;
  }
  
  // Extract object name - this is simplified
  if (lowerText.includes('bottle')) {
    if (wasteType === 'Plastic') {
      objectName = 'Plastic Bottle';
    } else if (wasteType === 'Glass') {
      objectName = 'Glass Bottle';
    } else {
      objectName = 'Bottle';
    }
    confidence += 0.1;
  } else if (lowerText.includes('can')) {
    objectName = 'Metal Can';
    confidence += 0.1;
  } else if (lowerText.includes('cardboard')) {
    objectName = 'Cardboard';
    wasteType = 'Paper';
    confidence += 0.1;
  } else if (lowerText.includes('food')) {
    objectName = 'Food Waste';
    confidence += 0.1;
  } else if (lowerText.includes('paper')) {
    objectName = 'Paper';
    confidence += 0.1;
  } else if (lowerText.includes('container') && wasteType === 'Plastic') {
    objectName = 'Plastic Container';
    confidence += 0.1;
  }
  
  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);
  
  // Create a structured response
  return {
    wasteType,
    objectName,
    confidence,
    details: {
      recyclability: extractRelevantInfo(analysisText, 'recyclability'),
      disposalMethod: extractRelevantInfo(analysisText, 'disposal'),
      environmentalImpact: extractRelevantInfo(analysisText, 'environmental impact'),
      tips: extractRelevantInfo(analysisText, 'tips'),
      specificGuidelines: extractRelevantInfo(analysisText, 'guidelines')
    },
    rawAnalysis: analysisText
  };
}

/**
 * Extract relevant information from the analysis text based on a topic
 * @param {string} text - The full analysis text
 * @param {string} topic - The topic to extract information about
 * @returns {string} - The extracted information or a default message
 */
function extractRelevantInfo(text: string, topic: string): string {
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Find sentences that contain the topic
  const relevantSentences = sentences.filter(sentence => 
    sentence.toLowerCase().includes(topic.toLowerCase())
  );
  
  if (relevantSentences.length > 0) {
    return relevantSentences.join('. ') + '.';
  }
  
  // Default messages based on topic
  const defaults: Record<string, string> = {
    recyclability: 'Please check local recycling guidelines for this item.',
    disposal: 'Check with your local waste management authority for proper disposal methods.',
    'environmental impact': 'Improper disposal can harm the environment.',
    tips: 'Consider reducing consumption and reusing items when possible.',
    guidelines: 'Follow local waste sorting guidelines for proper disposal.'
  };
  
  return defaults[topic] || 'Information not available.';
}

/**
 * Sends a question about waste to Gemini AI
 * @param {string} question - The question about waste
 * @returns {Promise<{answer: string, wasteType: string, suggestions: string[]}>} - The answer from Gemini
 */
export const askGeminiAboutWaste = async (question: string): Promise<{answer: string, wasteType: string, suggestions: string[]}> => {
  try {
    const response = await axios.post('http://localhost:4000/analyze-text', {
      prompt: question
    });
    
    if (response.data && response.data.analysis) {
      const analysis = response.data.analysis;
      const wasteType = inferWasteTypeFromQuestion(question);
      const suggestions = getWasteTipsForType(wasteType).split(' | ');
      
      return {
        answer: analysis,
        wasteType: wasteType,
        suggestions: suggestions.length > 0 ? suggestions : ['Reduce waste when possible', 'Recycle according to local guidelines']
      };
    } else {
      throw new Error('Invalid response from Gemini service');
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    // Return a fallback response
    const wasteType = inferWasteTypeFromQuestion(question);
    return {
      answer: getWasteInfoForType(wasteType),
      wasteType: wasteType,
      suggestions: getWasteTipsForType(wasteType).split(' | ')
    };
  }
};

/**
 * Tries to infer waste type from a question
 * @param {string} question - The question about waste
 * @returns {string} - The inferred waste type
 */
export const inferWasteTypeFromQuestion = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('plastic') || lowerQuestion.includes('bottle') || lowerQuestion.includes('container')) {
    return 'Plastic';
  } else if (lowerQuestion.includes('paper') || lowerQuestion.includes('cardboard') || lowerQuestion.includes('newspaper')) {
    return 'Paper';
  } else if (lowerQuestion.includes('glass') || lowerQuestion.includes('bottle')) {
    return 'Glass';
  } else if (lowerQuestion.includes('metal') || lowerQuestion.includes('aluminum') || lowerQuestion.includes('can')) {
    return 'Metal';
  } else if (lowerQuestion.includes('food') || lowerQuestion.includes('organic') || lowerQuestion.includes('compost')) {
    return 'Organic';
  } else if (lowerQuestion.includes('electronic') || lowerQuestion.includes('device') || lowerQuestion.includes('battery')) {
    return 'Electronics';
  } else if (lowerQuestion.includes('hazardous') || lowerQuestion.includes('chemical') || lowerQuestion.includes('toxic')) {
    return 'Hazardous';
  }
  
  return 'General Waste';
};

/**
 * Gets information about a specific waste type
 * @param {string} wasteType - The type of waste
 * @returns {string} - Information about the waste type
 */
export const getWasteInfoForType = (wasteType: string): string => {
  switch (wasteType.toLowerCase()) {
    case 'plastic':
      return 'Plastic waste should be cleaned and sorted by type (PET, HDPE, etc.) before recycling. Not all plastics are recyclable in all areas. Check with your local recycling center for specific guidelines.';
    case 'paper':
      return 'Paper and cardboard should be clean and dry before recycling. Remove any plastic film, tape, or non-paper materials. Shredded paper may need special handling.';
    case 'glass':
      return 'Glass is 100% recyclable and can be recycled endlessly without loss in quality. Different colors of glass may need to be separated. Always rinse glass containers before recycling.';
    case 'metal':
      return 'Most metal items like aluminum cans and steel containers are highly recyclable. Clean and empty containers before recycling. Some specialty metals may require special handling.';
    case 'organic':
      return 'Organic waste like food scraps and yard waste can be composted. Composting reduces methane emissions from landfills and creates nutrient-rich soil for gardening.';
    case 'electronics':
      return 'Electronic waste contains valuable materials that can be recovered, as well as potentially harmful substances. Many communities have special e-waste collection programs or events.';
    case 'hazardous':
      return 'Hazardous waste requires special handling and should never be thrown in regular trash. This includes batteries, paints, chemicals, and certain cleaning products. Look for hazardous waste collection in your area.';
    default:
      return 'Check with your local waste management authority for proper disposal guidelines for this type of waste.';
  }
};

/**
 * Gets tips for handling a specific waste type
 * @param {string} wasteType - The type of waste
 * @returns {string} - Tips for the waste type
 */
export const getWasteTipsForType = (wasteType: string): string => {
  switch (wasteType.toLowerCase()) {
    case 'plastic':
      return 'Reduce plastic use by choosing reusable items | Rinse containers before recycling | Check the recycling number on the bottom';
    case 'paper':
      return 'Use both sides of paper before recycling | Keep paper dry and clean | Remove plastic windows from envelopes';
    case 'glass':
      return 'Rinse thoroughly | Remove lids and caps (recycle separately) | Don\'t break glass before recycling';
    case 'metal':
      return 'Rinse food residue | Crush cans to save space | Keep metal items separate from other recyclables';
    case 'organic':
      return 'Compost food scraps when possible | Avoid putting meat or dairy in home compost | Use yard waste for mulch';
    case 'electronics':
      return 'Donate working electronics | Remove batteries before disposal | Look for e-waste recycling events';
    case 'hazardous':
      return 'Never pour chemicals down drains | Store in original containers | Use up products completely when possible';
    default:
      return 'Reduce consumption when possible | Reuse items where practical | Recycle according to local guidelines';
  }
};