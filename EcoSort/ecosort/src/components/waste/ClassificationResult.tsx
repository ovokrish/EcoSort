import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Recycle, Trash, Battery, Apple, Leaf, Package, ChevronDown, ChevronUp, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WasteClassificationResult } from '@/services/wasteClassification';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  imageUrl: string;
  classificationData: WasteClassificationResult;
  onScanAgain: () => void;
};

const getWasteIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'plastic':
    case 'paper':
    case 'metal':
    case 'glass':
      return <Recycle className="h-6 w-6" />;
    case 'organic':
      return <Leaf className="h-6 w-6" />;
    case 'electronics':
      return <Battery className="h-6 w-6" />;
    case 'hazardous':
      return <Trash className="h-6 w-6" />;
    default:
      return <Package className="h-6 w-6" />;
  }
};

const getWasteColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'plastic':
      return 'bg-blue-100 text-blue-800';
    case 'paper':
      return 'bg-yellow-100 text-yellow-800';
    case 'glass':
      return 'bg-ecosort-glass text-blue-800';
    case 'organic':
      return 'bg-green-100 text-green-800';
    case 'electronics':
      return 'bg-purple-100 text-purple-800';
    case 'metal':
      return 'bg-gray-100 text-gray-800';
    case 'hazardous':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const isRecyclable = (type: string): boolean => {
  switch (type.toLowerCase()) {
    case 'plastic':
    case 'paper':
    case 'glass':
    case 'metal':
    case 'electronics':
      return true;
    case 'organic':
      return true; // Compostable
    case 'hazardous':
      return false;
    default:
      return false;
  }
};

const ClassificationResult: React.FC<Props> = ({ imageUrl, classificationData, onScanAgain }) => {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const recyclable = isRecyclable(classificationData.wasteType);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classification Result</CardTitle>
          <CardDescription>
            Here's what we found and how to dispose of it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Classified waste item" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-white/90">
                {Math.round(classificationData.confidence * 100)}% confidence
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            {/* Object Detection Result */}
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${getWasteColor(classificationData.wasteType)}`}>
                {getWasteIcon(classificationData.wasteType)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{classificationData.objectName}</h3>
                <p className="text-sm text-gray-500">
                  Classified as {classificationData.wasteType.toLowerCase()} waste
                </p>
              </div>
            </div>

            {/* Quick Status */}
            <Alert className={recyclable ? 'bg-green-50' : 'bg-yellow-50'}>
              <Info className={`h-4 w-4 ${recyclable ? 'text-green-600' : 'text-yellow-600'}`} />
              <AlertDescription className={recyclable ? 'text-green-700' : 'text-yellow-700'}>
                {classificationData.details?.recyclability}
              </AlertDescription>
            </Alert>

            {/* Special handling for Gemini AI responses */}
            {classificationData.details?.disposalMethod && classificationData.details.disposalMethod.length > 100 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Gemini AI Response:</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {classificationData.details.disposalMethod}
                </div>
                
                {classificationData.details.tips && classificationData.details.tips.includes('|') && (
                  <div className="mt-4">
                    <h4 className="font-medium text-blue-700 mb-2">Quick Tips:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {classificationData.details.tips.split('|').map((tip, index) => (
                        <li key={index} className="text-gray-700">{tip.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Guidelines */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Disposal Guidelines</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {detailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Specific Guidelines */}
                {classificationData.details?.specificGuidelines && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Specific Instructions</h4>
                    <p className="text-sm text-gray-700">
                      {classificationData.details.specificGuidelines}
                    </p>
                  </div>
                )}

                {/* Disposal Method */}
                <div>
                  <h4 className="font-medium mb-2">How to Dispose</h4>
                  <p className="text-sm text-gray-700">
                    {classificationData.details?.disposalMethod}
                  </p>
                </div>

                {/* Environmental Impact */}
                <div>
                  <h4 className="font-medium mb-2">Environmental Impact</h4>
                  <p className="text-sm text-gray-700">
                    {classificationData.details?.environmentalImpact}
                  </p>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="font-medium mb-2">Tips</h4>
                  <p className="text-sm text-gray-700">
                    {classificationData.details?.tips}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button 
              onClick={onScanAgain} 
              className="w-full mt-4"
              variant="outline"
            >
              Scan Another Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassificationResult;
