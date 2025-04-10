import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Check, ZapIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { classifyWasteImage } from '@/services/wasteClassification';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Props = {
  onImageCaptured: (imageData: string, classification: any) => void;
};

const CameraCapture: React.FC<Props> = ({ onImageCaptured }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (isCameraOpen) {
      closeCamera();
      setTimeout(() => {
        openCamera();
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const openCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraOpen(true);
      setShowPreview(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or browser');
      }
      
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error('Error playing video:', playErr);
          throw new Error('Unable to display camera feed');
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Could not access camera';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please enable camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (facingMode === 'user') {
          context.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        setShowPreview(true);
      }
    } else {
      console.error('Video or canvas reference not available');
      toast.error('Failed to capture image. Please try again.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setApiError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        if (!imageData) {
          toast.error('Failed to read image file');
          return;
        }

        setCapturedImage(imageData);
        setShowPreview(true);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File handling error:', error);
      toast.error('Failed to process image');
      setIsProcessing(false);
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
    setCameraError(null);
    setShowPreview(false);
    setApiError(null);
  };

  const submitImage = async () => {
    if (!capturedImage) {
      toast.error('No image captured. Please capture an image first.');
      return;
    }
    
    setIsProcessing(true);
    setApiError(null);
    
    try {
      const loadingToast = toast.loading('Analyzing image...', { duration: 10000 });
      
      // Send the image to the backend for classification
      const classification = await classifyWasteImage(capturedImage);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Pass the results to the parent component
      onImageCaptured(capturedImage, classification);
      
      // Show success message based on confidence
      if (classification.confidence < 0.5) {
        toast.warning('Low confidence detection. Consider taking another photo with better lighting.');
      } else {
        toast.success(`Successfully identified as ${classification.objectName}!`);
      }
    } catch (error) {
      console.error('Error classifying image:', error);
      setApiError('Failed to classify image. The AI service might be unavailable.');
      setShowApiErrorDialog(true);
      toast.error('Classification failed. Please try again or use manual input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setShowPreview(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Hidden canvas element for capturing images */}
      <canvas ref={canvasRef} className="hidden" />
      
      {capturedImage && showPreview ? (
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured waste" 
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              onClick={resetImage}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button 
              onClick={submitImage}
              className="flex-1 bg-ecosort-primary hover:bg-ecosort-primary/90"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <ZapIcon className="h-4 w-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Upload for Scan
                </>
              )}
            </Button>
          </div>
        </div>
      ) : isCameraOpen ? (
        <div className="space-y-4">
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-full h-64 object-cover rounded-lg"
              autoPlay 
              playsInline
              muted
            />
            <Button
              onClick={toggleCamera}
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center">
            <Button 
              onClick={captureImage}
              className="bg-ecosort-primary hover:bg-ecosort-primary/90"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Take a photo of your waste item or upload an image
            </p>
            <div className="flex space-x-4">
              <Button 
                onClick={openCamera}
                className="bg-ecosort-primary hover:bg-ecosort-primary/90"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
      
      {cameraError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Error</AlertTitle>
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}
      
      {/* Debug button for development only */}
      {import.meta.env.DEV && capturedImage && (
        <div className="mt-4">
          <Button 
            onClick={() => {
              // Create a bottle classification for testing
              const bottleClassification = {
                wasteType: 'Plastic',
                objectName: 'Plastic Bottle',
                confidence: 0.95,
                details: {
                  recyclability: 'Most plastic bottles are recyclable, check for the recycling symbol and number.',
                  disposalMethod: 'Rinse bottle, remove cap and label if required by your local facility. Check the recycling number at the bottom.',
                  environmentalImpact: 'Plastic bottles take hundreds of years to break down and can harm wildlife and ecosystems if not properly disposed of.',
                  tips: 'Consider using a reusable water bottle to reduce plastic waste. Many facilities accept only bottles with necks for recycling.',
                  specificGuidelines: 'Empty and rinse the bottle. Remove cap and label if required by your local facility. Check the recycling number at the bottom.'
                }
              };
              
              // Call the handler with the test data
              onImageCaptured(capturedImage, bottleClassification);
              toast.success('Debug: Plastic bottle detected', {duration: 3000});
            }}
            variant="outline"
            className="w-full bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
          >
            Debug: Test Bottle Detection
          </Button>
        </div>
      )}
      
      {/* API Error Dialog */}
      <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
        <DialogContent>
          <DialogTitle>Classification Service Unavailable</DialogTitle>
          <DialogDescription>
            {apiError}
          </DialogDescription>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              You can still use the manual input option to classify your waste item.
            </p>
            <Button 
              onClick={() => setShowApiErrorDialog(false)}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CameraCapture;