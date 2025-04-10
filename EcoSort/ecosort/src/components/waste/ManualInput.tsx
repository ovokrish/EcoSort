import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Lightbulb, MessageSquare, Info, HelpCircle, Package, Loader2 } from 'lucide-react';

type Props = {
  onSubmit: (wasteType: string, description: string, isGeminiQuestion?: boolean) => void;
};

const ManualInput: React.FC<Props> = ({ onSubmit }) => {
  const [wasteType, setWasteType] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMethod, setInputMethod] = useState<'select' | 'prompt'>('select');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMethod === 'select' && !wasteType) {
      toast.error('Please select a waste type');
      return;
    }

    if (inputMethod === 'prompt' && !prompt) {
      toast.error('Please enter a question about waste disposal');
      return;
    }

    setIsSubmitting(true);
    
    if (inputMethod === 'select') {
      onSubmit(wasteType, description);
      toast.info('Processing waste classification...');
    } else {
      // For prompt-based classification, pass the prompt as a question for Gemini
      // The third parameter indicates this is a question for Gemini, not a waste type
      toast.info('Asking Gemini about your waste question...');
      onSubmit(prompt, prompt, true);
    }

    // Reset form after submission (on a delay to avoid UI glitches)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  // Suggested questions for the user to try
  const suggestedQuestions = [
    "How do I recycle plastic bottles?",
    "What's the best way to dispose of batteries?",
    "Can I recycle pizza boxes?",
    "How to properly dispose of electronics?",
    "Are plastic straws recyclable?",
    "How should I dispose of cooking oil?",
    "What do I do with old medications?",
    "Can I recycle bubble wrap?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setPrompt(question);
    setInputMethod('prompt');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Waste Information</CardTitle>
        <CardDescription>
          Select a waste type or ask Gemini AI for disposal guidance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="select" value={inputMethod} onValueChange={(value) => setInputMethod(value as 'select' | 'prompt')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="select" className="flex items-center justify-center">
              <Package className="h-4 w-4 mr-2" />
              <Label htmlFor="select" className="cursor-pointer">Select Type</Label>
            </TabsTrigger>
            <TabsTrigger value="prompt" className="flex items-center justify-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              <Label htmlFor="prompt" className="cursor-pointer">Ask a Question</Label>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waste-type">Waste Type</Label>
                <Select value={wasteType} onValueChange={setWasteType}>
                  <SelectTrigger id="waste-type">
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="paper">Paper (Office paper, Newspaper, Magazines, Cardboard)</SelectItem>
                    <SelectItem value="glass">Glass</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="hazardous">Hazardous</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the waste item (e.g., plastic water bottle)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none h-20"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-ecosort-primary hover:bg-ecosort-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Disposal Guide'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="prompt">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask a question about waste disposal
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., How do I recycle plastic bottles?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none h-20"
                />
                <p className="text-xs text-gray-500">
                  Powered by Google Gemini AI
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggested questions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-ecosort-primary hover:bg-ecosort-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Asking Gemini...
                  </>
                ) : (
                  'Get AI Answer'
                )}
              </Button>

              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    For common questions, the AI will provide guidance on proper waste disposal. For complex queries, you may get a simplified answer or be directed to select a waste type manually.
                  </p>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ManualInput;
