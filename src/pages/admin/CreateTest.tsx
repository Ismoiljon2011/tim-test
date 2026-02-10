import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MathEditor, MathRenderer } from '@/components/math/MathRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuestionForm {
  id: string;
  question_text: string;
  question_image_url: string;
  question_type: 'multiple_choice' | 'text_input';
  options: string[];
  correct_answer: string;
  points: number;
}

const createEmptyQuestion = (): QuestionForm => ({
  id: crypto.randomUUID(),
  question_text: '',
  question_image_url: '',
  question_type: 'multiple_choice',
  options: ['', '', '', ''],
  correct_answer: '',
  points: 1,
});

export default function CreateTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [questions, setQuestions] = useState<QuestionForm[]>([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
    setActiveQuestionIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const updateQuestion = (index: number, updates: Partial<QuestionForm>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const addOption = (questionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex || q.options.length >= 6) return q;
        return { ...q, options: [...q.options, ''] };
      })
    );
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex || q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, oi) => oi !== optionIndex);
        return { ...q, options: newOptions };
      })
    );
  };

  const handleImageUpload = async (questionIndex: number, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      updateQuestion(questionIndex, { question_image_url: urlData.publicUrl });
      toast({
        title: 'Image uploaded',
        description: 'The image has been added to the question.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Could not upload the image. Please try again.',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Please enter a test title.',
      });
      return;
    }

    if (questions.some((q) => !q.question_text.trim() && !q.question_image_url)) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Each question must have either text or an image.',
      });
      return;
    }

    if (questions.some((q) => !q.correct_answer.trim())) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Please provide a correct answer for each question.',
      });
      return;
    }

    setSaving(true);

    try {
      // Create test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          time_limit_minutes: timeLimitMinutes,
          show_results: showResults,
          created_by: user.id,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        test_id: testData.id,
        question_text: q.question_text.trim() || null,
        question_image_url: q.question_image_url || null,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options.filter((o) => o.trim()) : null,
        correct_answer: q.correct_answer.trim(),
        points: q.points,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: 'Test created!',
        description: 'Your test has been saved successfully.',
      });

      navigate('/admin/tests');
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save the test. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const activeQuestion = questions[activeQuestionIndex];

  // Global paste handler for clipboard images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageUpload(activeQuestionIndex, file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeQuestionIndex]);

  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tests')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Test</h1>
          <p className="text-muted-foreground">Add questions and configure your test</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left sidebar - Test settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Settings</CardTitle>
              <CardDescription>Configure your test properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter test title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter test description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  value={timeLimitMinutes || ''}
                  onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="No limit"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic">Public Test</Label>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showResults">Show Results</Label>
                <Switch
                  id="showResults"
                  checked={showResults}
                  onCheckedChange={setShowResults}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions list */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Questions</CardTitle>
                <Button size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(index)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      index === activeQuestionIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <GripVertical className="h-4 w-4 opacity-50" />
                    <span className="flex-1 truncate text-sm">
                      {q.question_text || q.question_image_url ? (
                        q.question_text?.slice(0, 30) || 'Image question'
                      ) : (
                        `Question ${index + 1}`
                      )}
                    </span>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(index);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content - Question editor */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            key={activeQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Question {activeQuestionIndex + 1}</CardTitle>
                <CardDescription>Edit your question content and options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question type */}
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={activeQuestion.question_type}
                    onValueChange={(value: 'multiple_choice' | 'text_input') =>
                      updateQuestion(activeQuestionIndex, { question_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="text_input">Text Input</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question text with math editor */}
                <div className="space-y-2">
                  <Label>Question Text (supports math notation)</Label>
                  <MathEditor
                    value={activeQuestion.question_text}
                    onChange={(value) => updateQuestion(activeQuestionIndex, { question_text: value })}
                    placeholder="Enter your question with math symbols..."
                  />
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label>Question Image (optional)</Label>
                  {activeQuestion.question_image_url ? (
                    <div className="relative">
                      <img
                        src={activeQuestion.question_image_url}
                        alt="Question"
                        className="max-h-48 rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => updateQuestion(activeQuestionIndex, { question_image_url: '' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (const item of Array.from(items)) {
                            if (item.type.startsWith('image/')) {
                              const file = item.getAsFile();
                              if (file) handleImageUpload(activeQuestionIndex, file);
                              break;
                            }
                          }
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          handleImageUpload(activeQuestionIndex, file);
                        }
                      }}
                      tabIndex={0}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(activeQuestionIndex, file);
                        }}
                      />
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload, drag & drop, or paste from clipboard</span>
                    </label>
                  )}
                </div>

                {/* Options for multiple choice */}
                {activeQuestion.question_type === 'multiple_choice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      {activeQuestion.options.length < 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(activeQuestionIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      )}
                    </div>
                    {activeQuestion.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(activeQuestionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {activeQuestion.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(activeQuestionIndex, optionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct answer */}
                <div className="space-y-2">
                  <Label>Correct Answer *</Label>
                  {activeQuestion.question_type === 'multiple_choice' ? (
                    <Select
                      value={activeQuestion.correct_answer}
                      onValueChange={(value) =>
                        updateQuestion(activeQuestionIndex, { correct_answer: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeQuestion.options
                          .filter((o) => o.trim())
                          .map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={activeQuestion.correct_answer}
                      onChange={(e) =>
                        updateQuestion(activeQuestionIndex, { correct_answer: e.target.value })
                      }
                      placeholder="Enter the correct answer..."
                    />
                  )}
                </div>

                {/* Points */}
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min={1}
                    value={activeQuestion.points}
                    onChange={(e) =>
                      updateQuestion(activeQuestionIndex, { points: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/tests')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Test'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
