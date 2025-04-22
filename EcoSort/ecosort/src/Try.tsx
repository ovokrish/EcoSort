import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import axios from 'axios';
import { Upload, Send, Image, MessageSquare, Loader, CheckCircle, X, Camera, Mic, Leaf, Award, Lightbulb, ArrowLeft, Trash2, Droplet, Recycle } from 'lucide-react';

// Random eco facts/tips that will display while scanning
const ecoTips = [
  "Recycling one plastic bottle saves enough energy to power a lightbulb for 3 hours!",
  "The average person generates about 4.5 pounds of trash every day.",
  "Glass is 100% recyclable and can be recycled endlessly without quality loss.",
  "Paper can be recycled 5-7 times before the fibers become too short.",
  "Aluminum cans can be recycled indefinitely and return to the shelf in just 60 days.",
  "It takes 450+ years for a plastic bottle to decompose in a landfill.",
  "E-waste is the fastest growing waste stream in the world.",
  "Nearly 9 million tons of plastic end up in our oceans each year.",
  "Composting food waste can reduce methane emissions from landfills."
];

const WasteClassifier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // const [points, setPoints] = useState<number>(0);
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('ecoPoints')) || 0);

  // Animate progress bar during analysis
  useEffect(() => {
    if (loading) {
      setCurrentTip(ecoTips[Math.floor(Math.random() * ecoTips.length)]);
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          // Slow down as it approaches 90%
          if (prev < 90) {
            return prev + (90 - prev) / 20;
          }
          return prev;
        });
      }, 200);
      
      return () => {
        clearInterval(interval);
        if (!loading) {
          setAnalysisProgress(100);
        }
      };
    } else if (result) {
      setAnalysisProgress(100);
    }
  }, [loading, result]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };
  useEffect(() => {
    localStorage.setItem('ecoPoints', points.toString());
  }, [points]);

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }

    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.remove('bg-green-50', 'border-green-600', 'animate-pulse');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.add('bg-green-50', 'border-green-600', 'animate-pulse');
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.remove('bg-green-50', 'border-green-600', 'animate-pulse');
    }
  };

  const handleClickUpload = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetForm = (): void => {
    setSelectedFile(null);
    setPreviewUrl('');
    setPrompt('');
    setResult('');
    setError('');
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      setError('');
      setIsCameraActive(true);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported in your browser');
      }

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log('Getting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got media stream:', stream);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      streamRef.current = stream;

      videoElement.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        videoElement.play()
          .then(() => {
            console.log('Video playback started');
          })
          .catch(playError => {
            console.error('Error playing video:', playError);
            setError('Failed to start video preview');
            stopCamera();
          });
      };

      videoElement.onerror = (err) => {
        console.error('Video element error:', err);
        setError('Error with video preview');
        stopCamera();
      };

    } catch (err) {
      console.error('Camera initialization error:', err);
      setError(err instanceof Error ? err.message : 'Could not access camera. Please check permissions.');
      stopCamera();
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
          setIsCameraActive(false);
        }
      }, 'image/jpeg');
    }
  };

  const analyzeImage = async (): Promise<void> => {
    setPoints(points+5);
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    if (!navigator.onLine) {
      setLoading(false);
      setError("You're offline! Please connect to the internet to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (prompt) {
      formData.append('prompt', prompt);
    }

    try {
      const response = await axios.post<{ analysis: string }>('http://localhost:4000/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data.analysis);
    } catch (err) {
      console.error('Error analyzing image:', err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to analyze image. Please try again.'
        : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async (): Promise<void> => {
    if (!textPrompt.trim()) {
      setError('Please enter a question first');
      return;
    }

    setLoading(true);
    setError('');

    if (!navigator.onLine) {
      setLoading(false);
      setError("You're offline! Please connect to the internet to analyze.");
      return;
    }

    try {
      const response = await axios.post<{ analysis: string }>('http://localhost:4000/analyze-text', {
        prompt: textPrompt
      });

      setResult(response.data.analysis);
    } catch (err) {
      console.error('Error analyzing text:', err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to process your question. Please try again.'
        : 'Failed to process your question. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with wave background */}
      <header className="relative bg-gradient-to-r from-green-600 to-teal-500 text-white py-8 shadow-md overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#f9fafb">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,53.3C1120,53,1280,75,1360,85.3L1440,96L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <button
            onClick={() => window.history.back()}
            className="absolute left-4 top-0 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <Recycle className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Waste Classifier</h1>
          </div>
          <p className="mt-2 text-black font-semibold">Drop it, snap it, sort it 🌍</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs with animation */}
        <div className="relative bg-white rounded-lg shadow-md p-1 mb-6 flex">
          <button
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 z-10 ${activeTab === 'image' ? 'text-white' : 'text-gray-600'}`}
            onClick={() => setActiveTab('image')}
          >
            <Image className="w-5 h-5" />
            <span>Image Analysis</span>
          </button>
          <button
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 z-10 ${activeTab === 'text' ? 'text-white' : 'text-gray-600'}`}
            onClick={() => setActiveTab('text')}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Text Question</span>
          </button>
          
          {/* Animated background for active tab */}
          <div 
            className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300 ease-in-out ${activeTab === 'image' ? 'left-1 right-[calc(50%+1px)]' : 'left-[calc(50%+1px)] right-1'}`}
          ></div>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'image' ? (
            <div className="space-y-6">
              <div style={{ display: isCameraActive ? 'block' : 'none' }}>
                <div className="relative">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform transition hover:scale-105"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg transform transition hover:scale-105"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                  </div>
                  {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-2 rounded-lg">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {!isCameraActive && (
                <>
                  <div className="flex gap-4 justify-center mb-6">
                    <button
                      onClick={handleClickUpload}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all shadow-sm hover:shadow-md group"
                    >
                      <Upload className="h-6 w-6 transition-transform group-hover:-translate-y-1 duration-300" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      onClick={startCamera}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg group"
                    >
                      <Camera className="h-6 w-6 transition-transform group-hover:scale-110 duration-300" />
                      <span>Take Photo</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <div
                    id="dropZone"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-teal-400 relative"
                    onClick={handleClickUpload}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Recycle className="h-32 w-32 text-teal-300" />
                    </div>
                    <div className="relative z-10">
                      <Upload className="mx-auto h-12 w-12 text-teal-500 mb-4" />
                      <h3 className="text-lg font-medium">Drop your item here</h3>
                      <p className="text-gray-500">To get recycling advice!</p>
                    </div>
                  </div>
                </>
              )}

              {previewUrl && !isCameraActive && (
                <div className="relative mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Analysis Instructions (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="prompt"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                    placeholder="E.g., Is this recyclable? Which bin should this go in?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-500 transition-colors">
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-md flex items-center justify-center ${selectedFile ? 'bg-gradient-to-r from-green-600 to-teal-500 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'} text-white font-medium transition-all shadow-md hover:shadow-lg ${selectedFile && !loading ? 'hover:scale-[1.02]' : ''} duration-300`}
                onClick={analyzeImage}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                Analyze Image
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="textPrompt" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Your Question About Waste
                </label>
                <div className="relative">
                  <textarea
                    id="textPrompt"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 min-h-32 shadow-sm"
                    placeholder="Ask a question about waste recycling or disposal..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                  />
                  <div className="absolute left-3 top-6 text-gray-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <button className="absolute right-3 top-6 text-gray-400 hover:text-teal-500 transition-colors">
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-md flex items-center justify-center ${textPrompt.trim() ? 'bg-gradient-to-r from-green-600 to-teal-500 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'} text-white font-medium transition-all shadow-md hover:shadow-lg ${textPrompt.trim() && !loading ? 'hover:scale-[1.02]' : ''} duration-300`}
                onClick={analyzeText}
                disabled={!textPrompt.trim() || loading}
              >
                {loading ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                Submit Question
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-md animate-pulse">
              <div className="flex items-center mb-2">
                <Loader className="w-5 h-5 text-teal-600 mr-2 animate-spin" />
                <h3 className="font-medium text-teal-700">Analyzing...</h3>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-teal-500 transition-all duration-500 flex items-center justify-end" 
                  style={{ width: `${analysisProgress}%` }}>
                  <div className="h-4 w-4 bg-white rounded-full transform -translate-y-[2px] translate-x-1 shadow-sm"></div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-teal-600">
                <Leaf className="w-4 h-4 mr-2 animate-bounce" />
                <p className="text-teal-700 italic">Eco Tip: {currentTip}</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex justify-between items-center shadow-sm">
              <span>{error}</span>
              <button
                onClick={activeTab === 'image' ? analyzeImage : analyzeText}
                className="text-sm text-red-600 underline hover:text-red-800 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {result && !loading && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md shadow-md">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-700">AI Response:</h3>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed tracking-wide">
                {result}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">+5 points awarded!</span>
                </div>
                <p className="text-xs text-gray-500 italic">
                  *AI-generated result. Please verify before disposal.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Tips section */}
        <div className="mt-6 bg-teal-50 rounded-lg p-4 shadow-sm border border-teal-100">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-teal-800 mb-1">Eco Tips</h3>
              <ul className="text-sm text-teal-700 space-y-2">
                <li className="flex items-center">
                  <Droplet className="w-3 h-3 mr-2 text-teal-500" />
                  Rinse containers before recycling to avoid contamination
                </li>
                <li className="flex items-center">
                  <Droplet className="w-3 h-3 mr-2 text-teal-500" />
                  Remove caps and lids from bottles - they're often made from different plastics
                </li>
                <li className="flex items-center">
                  <Droplet className="w-3 h-3 mr-2 text-teal-500" />
                  Flatten cardboard boxes to save space in recycling bins
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 mt-8 bg-gray-100">
        <div className="container mx-auto">
          <p className="flex items-center justify-center gap-2">
            <Recycle className="h-4 w-4 text-teal-500" />
            EcoSort Waste Classifier - Helping you recycle properly
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WasteClassifier;
