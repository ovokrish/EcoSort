import React, { useState } from 'react';
import { Camera, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import CameraCapture from '@/components/waste/CameraCapture';
import ManualInput from '@/components/waste/ManualInput';
import ClassificationResult from '@/components/waste/ClassificationResult';
import { 
  classifyWasteImage,
  askGeminiAboutWaste,
  WasteClassificationResult,
  inferWasteTypeFromQuestion,
  getWasteInfoForType,
  getWasteTipsForType
} from '@/services/wasteClassification';
import { recordWasteScan } from '@/services/ecoPoints';
import { toast } from '@/lib/toast';

const ScanWaste = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [classification, setClassification] = useState<WasteClassificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageCaptured = async (imageData: string, classificationResult: WasteClassificationResult) => {
    if (!user) {
      toast.error('Please login to scan waste');
      navigate('/auth');
      return;
    }

    setCapturedImage(imageData);
    setIsProcessing(true);
    setProcessingStep('Analyzing image...');

    try {
      setClassification(classificationResult);
      
      // Record the scan
      setProcessingStep('Recording scan and calculating eco-points...');
      await recordWasteScan(user.id, classificationResult.wasteType, imageData);
      
      // Show success message with points
      const points = calculatePoints(classificationResult.wasteType);
      toast.success(`Waste classified as ${classificationResult.wasteType}! +${points} eco-points earned!`);
      
      // Show recycling tips if available
      if (classificationResult.details?.tips) {
        toast.info(classificationResult.details.tips, { duration: 5000 });
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Failed to classify waste. Please try again or use manual input.');
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleManualSubmit = async (wasteType: string, description: string, isGeminiQuestion: boolean = false) => {
    if (!user) {
      toast.error('Please login to classify waste');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Processing your request...');

    try {
      // If this is a question for Gemini, handle it with direct API call
      if (isGeminiQuestion && description) {
        setProcessingStep('Asking Gemini about your question...');
        
        // Call Gemini directly with the question
        try {
          console.log('Sending question to Gemini:', description);
          const { answer, wasteType, suggestions } = await askGeminiAboutWaste(description);
          console.log('Received answer from Gemini:', { answer, wasteType, suggestions });
          
          // Create a classification result from the Gemini response
          const questionClassification: WasteClassificationResult = {
            wasteType: wasteType,
            objectName: `${wasteType} Guidance`,
            confidence: 1.0,
            details: {
              recyclability: suggestions[0] || "See detailed answer",
              disposalMethod: answer,
              environmentalImpact: suggestions[1] || "See detailed answer",
              tips: suggestions.join(' | '),
              specificGuidelines: answer
            }
          };
          
          setClassification(questionClassification);
          
          // Generate a placeholder image
          const placeholderImage = `https://via.placeholder.com/400x300/e2e8f0/64748b?text=${encodeURIComponent(wasteType)}`;
          setCapturedImage(placeholderImage);
          
          // Record the interaction (optional for questions)
          await recordWasteScan(user.id, wasteType, placeholderImage);
          
          // Show success message
          toast.success(`Here's guidance on ${wasteType.toLowerCase()} waste!`);
          
          // Return early since we're showing the result now
          setIsProcessing(false);
          setProcessingStep('');
          return;
        } catch (error) {
          console.error('Error with Gemini Q&A:', error);
          
          // Fall back to local inferring
          const inferredWasteType = inferWasteTypeFromQuestion(description);
          const answer = `Based on your question about ${inferredWasteType.toLowerCase()} waste, here are some general guidelines:\n\n` + 
                        getWasteInfoForType(inferredWasteType);
          const suggestions = getWasteTipsForType(inferredWasteType);
          
          // Create a fallback classification
          const fallbackClassification: WasteClassificationResult = {
            wasteType: inferredWasteType,
            objectName: `${inferredWasteType} Guidance`,
            confidence: 0.7,
            details: {
              recyclability: "See detailed answer",
              disposalMethod: answer,
              environmentalImpact: "See detailed answer",
              tips: suggestions.join(' | '),
              specificGuidelines: answer
            }
          };
          
          setClassification(fallbackClassification);
          
          // Generate a placeholder image
          const placeholderImage = `https://via.placeholder.com/400x300/e2e8f0/64748b?text=${encodeURIComponent(inferredWasteType)}`;
          setCapturedImage(placeholderImage);
          
          toast.warning("Couldn't connect to Gemini AI. Using local database instead.");
          
          // Return early since we're showing the result now
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
      }
      
      // Otherwise, handle as normal waste type classification
      // Capitalize the waste type for consistency
      const formattedWasteType = wasteType.charAt(0).toUpperCase() + wasteType.slice(1).toLowerCase();
      
      // Create a more specific object name based on the description
      let objectName = formattedWasteType;
      if (description && description.trim()) {
        objectName = description.trim();
      } else {
        // Default object names by category
        switch (wasteType.toLowerCase()) {
          case 'plastic':
            objectName = 'Plastic Item';
            break;
          case 'paper':
            objectName = 'Paper Item';
            break;
          case 'metal':
            objectName = 'Metal Item';
            break;
          case 'glass':
            objectName = 'Glass Item';
            break;
          case 'organic':
            objectName = 'Organic Waste';
            break;
          case 'electronics':
            objectName = 'Electronic Device';
            break;
          case 'hazardous':
            objectName = 'Hazardous Material';
            break;
          default:
            objectName = 'Miscellaneous Item';
        }
      }
      
      // Create a manual classification result
      const manualClassification: WasteClassificationResult = {
        wasteType: formattedWasteType,
        objectName: objectName,
        confidence: 1.0,
        details: {
          recyclability: getRecyclabilityInfo(wasteType),
          disposalMethod: getDisposalMethod(wasteType),
          environmentalImpact: getEnvironmentalImpact(wasteType),
          tips: getWasteTips(wasteType),
          specificGuidelines: description ? 
            `Specific item: ${description}. ${getSpecificGuidelines(wasteType, description)}` : 
            getSpecificGuidelines(wasteType, '')
        }
      };
      
      setClassification(manualClassification);
      
      // Generate a placeholder image for manual submissions
      const placeholderImage = `https://via.placeholder.com/400x300/e2e8f0/64748b?text=${encodeURIComponent(objectName)}`;
      setCapturedImage(placeholderImage);
      
      // Record the scan
      setProcessingStep('Recording scan and calculating eco-points...');
      await recordWasteScan(user.id, formattedWasteType, placeholderImage);
      
      // Show success message with points
      const points = calculatePoints(formattedWasteType);
      toast.success(`Item classified as ${formattedWasteType} waste! +${points} eco-points earned!`);
      
      // Show recycling tips
      if (manualClassification.details?.tips) {
        toast.info(manualClassification.details.tips, { duration: 5000 });
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Failed to process waste information. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setClassification(null);
  };

  const calculatePoints = (wasteType: string): number => {
    // Award points based on waste type
    switch (wasteType.toLowerCase()) {
      case 'plastic':
        return 10;
      case 'paper':
        return 8;
      case 'glass':
        return 12;
      case 'metal':
        return 15;
      case 'organic':
        return 5;
      case 'electronics':
        return 20;
      case 'hazardous':
        return 25;
      default:
        return 5;
    }
  };

  // Helper functions for manual classification
  const getRecyclabilityInfo = (wasteType: string): string => {
    switch (wasteType.toLowerCase()) {
      case 'plastic':
        return 'Most plastics are recyclable, check for the recycling symbol and number';
      case 'paper':
        return 'Highly recyclable when clean and dry';
      case 'glass':
        return '100% recyclable and can be recycled indefinitely';
      case 'metal':
        return '100% recyclable and highly valuable in the recycling stream';
      case 'organic':
        return 'Compostable - can be converted into nutrient-rich soil';
      case 'electronics':
        return 'Contains valuable materials that can be recovered, but requires special handling';
      case 'hazardous':
        return 'Not recyclable in regular streams - requires special handling';
      default:
        return 'Check with your local recycling facility for specific guidelines';
    }
  };

  const getDisposalMethod = (wasteType: string): string => {
    switch (wasteType.toLowerCase()) {
      case 'plastic':
        return 'Rinse container, remove caps/lids (if different material), place in plastics recycling';
      case 'paper':
        return 'Keep dry and clean, remove any plastic or metal attachments, place in paper recycling';
      case 'glass':
        return 'Rinse containers, remove caps/lids, place in glass recycling bin';
      case 'metal':
        return 'Rinse containers, remove food residue, crush if possible to save space, place in metal recycling';
      case 'organic':
        return 'Place in home compost bin or municipal green waste collection';
      case 'electronics':
        return 'Take to an e-waste collection point, electronics retailer, or schedule special pickup';
      case 'hazardous':
        return 'Take to a hazardous waste collection facility, never place in regular trash or recycling';
      default:
        return 'If unsure, check with your local waste management authority for proper disposal';
    }
  };

  const getEnvironmentalImpact = (wasteType: string): string => {
    switch (wasteType.toLowerCase()) {
      case 'plastic':
        return 'Takes hundreds of years to break down, pollutes oceans and harms wildlife if not properly recycled';
      case 'paper':
        return 'Biodegradable but contributes to deforestation if not sustainably sourced and recycled';
      case 'glass':
        return 'Inert material that doesn\'t degrade, but production is energy-intensive so recycling is beneficial';
      case 'metal':
        return 'Mining for metals is environmentally damaging, but metals can be recycled indefinitely';
      case 'organic':
        return 'Produces methane (a potent greenhouse gas) in landfills, but beneficial when composted properly';
      case 'electronics':
        return 'Contains toxic materials that can leach into soil and water, recycling reduces need for mining';
      case 'hazardous':
        return 'Can contaminate soil, water, and air if not disposed of properly';
      default:
        return 'Improper disposal can harm ecosystems and wildlife';
    }
  };

  const getWasteTips = (wasteType: string): string => {
    switch (wasteType.toLowerCase()) {
      case 'plastic':
        return 'Check the recycling number (1-7) to ensure your facility accepts it. Avoid single-use plastics when possible.';
      case 'paper':
        return 'Shredded paper can usually be recycled but should be kept separate. Remove sticky notes before recycling.';
      case 'glass':
        return 'Different colors of glass should be separated if your facility requires it. Broken glass should be wrapped and labeled.';
      case 'metal':
        return 'Even small metal items like bottle caps can be recycled. Aluminum foil should be clean and balled up.';
      case 'organic':
        return 'Avoid putting meat, dairy, and oils in home compost bins. Turn compost regularly for faster breakdown.';
      case 'electronics':
        return 'Wipe personal data before recycling devices. Many manufacturers have take-back programs.';
      case 'hazardous':
        return 'Store hazardous waste in original containers when possible. Never mix different hazardous products.';
      default:
        return 'When in doubt, check with your local waste management authority before disposal.';
    }
  };

  const getSpecificGuidelines = (wasteType: string, description: string): string => {
    const desc = description.toLowerCase();
    
    if (wasteType.toLowerCase() === 'plastic') {
      if (desc.includes('bottle')) {
        return 'Empty and rinse the bottle. Remove cap and label if required by your local facility. Check the recycling number at the bottom.';
      } else if (desc.includes('bag')) {
        return 'Many grocery stores collect plastic bags for recycling. Note that many municipal programs don\'t accept them in regular recycling.';
      } else if (desc.includes('container') || desc.includes('tupperware')) {
        return 'Rinse food containers thoroughly. Remove any food residue. Some facilities may not accept all plastic containers, check the recycling number.';
      }
    } else if (wasteType.toLowerCase() === 'paper') {
      if (desc.includes('cardboard') || desc.includes('box')) {
        return 'Flatten cardboard boxes to save space. Remove any tape or plastic elements. Keep dry and clean.';
      } else if (desc.includes('magazine') || desc.includes('catalog')) {
        return 'Most magazines can be recycled as-is. Some facilities request removing staples, but this isn\'t always necessary.';
      } else if (desc.includes('newspaper')) {
        return 'Newspapers are highly recyclable. Bundle them separately if your facility requires it.';
      } else if (desc.includes('office') || desc.includes('printer') || desc.includes('white') && desc.includes('paper') || desc.includes('stack')) {
        return 'Office paper is highly recyclable. Keep it clean and dry. Paper clips and staples can typically stay attached as they\'re removed during processing. Shredded paper should be kept in a paper bag before recycling.';
      } else if (desc.includes('receipt')) {
        return 'Thermal receipts (shiny, slick paper) often contain BPA and should go in general waste. Standard paper receipts can be recycled with regular paper.';
      }
    }
    
    // General guidelines if no specific ones are matched
    return 'Follow the general guidelines for this waste type. When in doubt, contact your local recycling facility.';
  };

  // Add function to return to dashboard with refresh signal
  const goToDashboard = () => {
    navigate('/dashboard?refresh=true');
  };

  // Function that handles when user is done with the scan result
  const handleScanComplete = () => {
    // Navigate to dashboard with refresh parameter
    goToDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ecosort-primary p-4 text-white">
        <div className="max-w-xl mx-auto flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-1 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Waste Scanner</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-16 w-16 text-ecosort-primary mb-4">
              <Loader2 className="h-full w-full" />
            </div>
            <p className="text-gray-600 text-center">{processingStep}</p>
          </div>
        ) : classification && capturedImage ? (
          <ClassificationResult
            imageUrl={capturedImage}
            classificationData={classification}
            onScanAgain={resetScan}
            onComplete={handleScanComplete}
          />
        ) : (
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="camera" className="flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Manual Input
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera">
              <CameraCapture onImageCaptured={handleImageCaptured} />
            </TabsContent>
            
            <TabsContent value="manual">
              <ManualInput onSubmit={handleManualSubmit} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ScanWaste;
