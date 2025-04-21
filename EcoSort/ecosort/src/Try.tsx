import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import axios from 'axios';
import { Upload, Send, Image, MessageSquare, Loader, CheckCircle, X, Camera } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // const [points, setPoints] = useState<number>(0);
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('ecoPoints')) || 0);

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
      dropZone.classList.remove('bg-green-50', 'border-green-600');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.add('bg-green-50', 'border-green-600');
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.classList.remove('bg-green-50', 'border-green-600');
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
      <header className="bg-green-600 text-white py-6 shadow-md">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold">Waste Classifier</h1>
          <p className="mt-2">Upload an image or ask a question about waste recycling</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'image' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600'}`}
            onClick={() => setActiveTab('image')}
          >
            <div className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Image Analysis
            </div>
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'text' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600'}`}
            onClick={() => setActiveTab('text')}
          >
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Text Question
            </div>
          </button>
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
                      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg"
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
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Upload className="h-6 w-6" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      onClick={startCamera}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Camera className="h-6 w-6" />
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
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition hover:bg-gray-50"
                    onClick={handleClickUpload}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <Upload className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">Upload an Image</h3>
                    <p className="text-gray-500">Click or drag an image here to analyze</p>
                  </div>
                </>
              )}

              {previewUrl && !isCameraActive && (
                <div className="relative">
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                </div>
              )}

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Instructions (Optional)
                </label>
                <input
                  type="text"
                  id="prompt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="What would you like to know about this waste item?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${selectedFile ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'} text-white font-medium transition`}
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
              <div>
                <label htmlFor="textPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Question About Waste
                </label>
                <textarea
                  id="textPrompt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 min-h-32"
                  placeholder="Ask a question about waste recycling or disposal..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                />
              </div>

              <button
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${textPrompt.trim() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'} text-white font-medium transition`}
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

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={activeTab === 'image' ? analyzeImage : analyzeText}
                className="text-sm text-red-600 underline"
              >
                Retry
              </button>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-700">AI Response:</h3>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed tracking-wide">
                {result}
              </div>
              <p className="mt-2 text-xs text-gray-500 italic text-center">
                *This result is generated by an AI model. Please verify before disposal.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-gray-500 mt-8">
        <p>© 2025 Waste Classifier - Helping you recycle properly</p>
      </footer>
    </div>
  );
};

export default WasteClassifier;
