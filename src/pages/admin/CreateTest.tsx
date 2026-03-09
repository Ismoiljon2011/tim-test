import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, GripVertical, Upload, Wand2 } from 'lucide-react';
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

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
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!testId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [testType, setTestType] = useState<'practice' | 'olympiad'>('practice');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [startsAt, setStartsAt] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionForm[]>([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loadingTest, setLoadingTest] = useState(false);

  // Generator state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [genSubject, setGenSubject] = useState<'math' | 'english'>('math');
  const [genMethod, setGenMethod] = useState<'template' | 'ai'>('template');
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isEditing && testId) {
      loadTestData(testId);
    }
  }, [testId]);

  const loadTestData = async (id: string) => {
    setLoadingTest(true);
    try {
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (testError || !testData) throw testError || new Error('Test not found');

      setTitle(testData.title);
      setDescription(testData.description || '');
      setIsPublic(testData.is_public);
      setTestType((testData as any).test_type || 'practice');
      setTimeLimitMinutes(testData.time_limit_minutes);
      setShowResults(testData.show_results);
      setStartsAt((testData as any).starts_at ? new Date((testData as any).starts_at).toISOString().slice(0, 16) : '');

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData.map(q => ({
          id: q.id,
          question_text: q.question_text || '',
          question_image_url: q.question_image_url || '',
          question_type: q.question_type as 'multiple_choice' | 'text_input',
          options: (q.options as string[]) || ['', '', '', ''],
          correct_answer: q.correct_answer,
          points: q.points,
        })));
      }
    } catch (error) {
      console.error('Error loading test:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load the test.' });
    } finally {
      setLoadingTest(false);
    }
  };

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
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      updateQuestion(questionIndex, { question_image_url: urlData.publicUrl });
      toast({ title: 'Image uploaded', description: 'The image has been added to the question.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error?.message || 'Could not upload the image.' });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Validation error', description: 'Please enter a test title.' });
      return;
    }

    if (questions.some((q) => !q.question_text.trim() && !q.question_image_url)) {
      toast({ variant: 'destructive', title: 'Validation error', description: 'Each question must have either text or an image.' });
      return;
    }

    if (questions.some((q) => !q.correct_answer.trim())) {
      toast({ variant: 'destructive', title: 'Validation error', description: 'Please provide a correct answer for each question.' });
      return;
    }

    setSaving(true);

    try {
      const testPayload: any = {
        title: title.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        time_limit_minutes: timeLimitMinutes,
        show_results: showResults,
        test_type: testType,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      };

      if (isEditing && testId) {
        const { error: testError } = await supabase
          .from('tests')
          .update(testPayload)
          .eq('id', testId);

        if (testError) throw testError;

        await supabase.from('questions').delete().eq('test_id', testId);

        const questionsToInsert = questions.map((q, index) => ({
          test_id: testId,
          question_text: q.question_text.trim() || null,
          question_image_url: q.question_image_url || null,
          question_type: q.question_type,
          options: q.question_type === 'multiple_choice' ? q.options.filter((o) => o.trim()) : null,
          correct_answer: q.correct_answer.trim(),
          points: q.points,
          order_index: index,
        }));

        const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;

        toast({ title: 'Test updated!', description: 'Your test has been saved successfully.' });
      } else {
        testPayload.created_by = user.id;
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .insert(testPayload)
          .select()
          .single();

        if (testError) throw testError;

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

        const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;

        toast({ title: 'Test created!', description: 'Your test has been saved successfully.' });
      }

      navigate('/admin/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the test. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Shuffle array helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Template-based question generation
  const generateTemplateQuestions = (subject: 'math' | 'english', count: number, difficulty: 'easy' | 'medium' | 'hard'): QuestionForm[] => {
    const generated: QuestionForm[] = [];
    const usedKeys = new Set<string>();

    if (subject === 'math') {
      // Difficulty tuned for 4th-5th grade students
      const ops = difficulty === 'easy'
        ? ['+', '-']
        : difficulty === 'medium'
        ? ['+', '-', '×', '÷']
        : ['+', '-', '×', '÷', 'frac', 'pow'];

      const ranges = {
        easy: { add: 100, mul: 12 },
        medium: { add: 500, mul: 20 },
        hard: { add: 1000, mul: 25 },
      }[difficulty];

      let attempts = 0;
      while (generated.length < count && attempts < count * 10) {
        attempts++;
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a: number, b: number, answer: number, text: string;

        switch (op) {
          case '+':
            a = Math.floor(Math.random() * ranges.add) + 10;
            b = Math.floor(Math.random() * ranges.add) + 10;
            answer = a + b;
            text = `${a} + ${b} = ?`;
            break;
          case '-':
            a = Math.floor(Math.random() * ranges.add) + 20;
            b = Math.floor(Math.random() * (a - 1)) + 1;
            answer = a - b;
            text = `${a} - ${b} = ?`;
            break;
          case '×':
            a = Math.floor(Math.random() * ranges.mul) + 2;
            b = Math.floor(Math.random() * ranges.mul) + 2;
            answer = a * b;
            text = `${a} \\times ${b} = ?`;
            break;
          case '÷':
            b = Math.floor(Math.random() * ranges.mul) + 2;
            answer = Math.floor(Math.random() * ranges.mul) + 1;
            a = b * answer;
            text = `${a} \\div ${b} = ?`;
            break;
          case 'frac':
            b = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)];
            a = Math.floor(Math.random() * (b - 1)) + 1;
            const b2 = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)];
            const a2 = Math.floor(Math.random() * (b2 - 1)) + 1;
            if (b === b2) {
              answer = a + a2;
              text = `\\frac{${a}}{${b}} + \\frac{${a2}}{${b2}} = ?`;
            } else {
              answer = a * b2 + a2 * b;
              text = `\\frac{${a}}{${b}} + \\frac{${a2}}{${b2}} = \\frac{?}{${b * b2}}`;
            }
            break;
          case 'pow':
          default:
            a = Math.floor(Math.random() * 10) + 2;
            answer = a * a;
            text = `${a}^2 = ?`;
            break;
        }

        const key = text;
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);

        // Generate wrong options that are distinct
        const wrongSet = new Set<number>();
        let wrongAttempts = 0;
        while (wrongSet.size < 3 && wrongAttempts < 50) {
          wrongAttempts++;
          const offset = Math.floor(Math.random() * Math.max(10, Math.abs(answer) * 0.3)) + 1;
          const sign = Math.random() < 0.5 ? 1 : -1;
          const wrong = answer + sign * offset;
          if (wrong !== answer && wrong >= 0 && !wrongSet.has(wrong)) wrongSet.add(wrong);
        }
        // Fallback if not enough wrongs
        let fallback = 1;
        while (wrongSet.size < 3) {
          if (answer + fallback !== answer && !wrongSet.has(answer + fallback)) wrongSet.add(answer + fallback);
          fallback++;
        }

        const allOptions = shuffleArray([answer.toString(), ...Array.from(wrongSet).map(String)]);

        const q = createEmptyQuestion();
        q.question_text = text;
        q.options = allOptions;
        q.correct_answer = answer.toString();
        q.question_type = 'multiple_choice';
        generated.push(q);
      }
    } else {
      // English - expanded pool for uniqueness
      const easyWords = [
        { word: 'apple', answer: 'A fruit', wrongs: ['A car', 'A color', 'A number'] },
        { word: 'book', answer: 'Something to read', wrongs: ['A drink', 'A tool', 'A sport'] },
        { word: 'cat', answer: 'An animal', wrongs: ['A plant', 'A building', 'A machine'] },
        { word: 'dog', answer: 'A pet animal', wrongs: ['A fish', 'A bird', 'An insect'] },
        { word: 'house', answer: 'A building to live in', wrongs: ['A type of food', 'A vehicle', 'A musical instrument'] },
        { word: 'water', answer: 'A liquid we drink', wrongs: ['A solid material', 'A gas', 'A type of metal'] },
        { word: 'sun', answer: 'A star', wrongs: ['A planet', 'A moon', 'An asteroid'] },
        { word: 'tree', answer: 'A plant', wrongs: ['An animal', 'A mineral', 'A liquid'] },
        { word: 'fish', answer: 'An aquatic animal', wrongs: ['A bird', 'A fruit', 'A tool'] },
        { word: 'car', answer: 'A vehicle', wrongs: ['A fruit', 'An animal', 'A building'] },
        { word: 'moon', answer: 'Earth\'s natural satellite', wrongs: ['A star', 'A planet', 'A comet'] },
        { word: 'pencil', answer: 'A writing tool', wrongs: ['A food item', 'A toy', 'A drink'] },
        { word: 'chair', answer: 'Furniture to sit on', wrongs: ['A type of food', 'A vehicle', 'A sport'] },
        { word: 'rain', answer: 'Water falling from clouds', wrongs: ['A type of food', 'A musical instrument', 'A color'] },
        { word: 'school', answer: 'A place to learn', wrongs: ['A type of food', 'An animal', 'A vehicle'] },
        { word: 'flower', answer: 'Part of a plant', wrongs: ['An animal', 'A vehicle', 'A tool'] },
        { word: 'snow', answer: 'Frozen water crystals', wrongs: ['A plant', 'A metal', 'A gas'] },
        { word: 'teacher', answer: 'A person who teaches', wrongs: ['A type of food', 'An animal', 'A tool'] },
        { word: 'bird', answer: 'A flying animal', wrongs: ['A fish', 'A plant', 'A mineral'] },
        { word: 'mountain', answer: 'A tall landform', wrongs: ['A body of water', 'A type of cloud', 'A musical instrument'] },
      ];

      const mediumSentences = [
        { q: 'She ___ to school every day.', answer: 'goes', wrongs: ['go', 'going', 'gone'] },
        { q: 'They ___ playing football now.', answer: 'are', wrongs: ['is', 'was', 'be'] },
        { q: 'I ___ a new book yesterday.', answer: 'bought', wrongs: ['buy', 'buying', 'buys'] },
        { q: 'He ___ already finished his homework.', answer: 'has', wrongs: ['have', 'had', 'having'] },
        { q: 'We will ___ to the park tomorrow.', answer: 'go', wrongs: ['goes', 'going', 'went'] },
        { q: 'The children ___ in the garden.', answer: 'are playing', wrongs: ['is playing', 'was playing', 'plays'] },
        { q: 'She ___ English very well.', answer: 'speaks', wrongs: ['speak', 'speaking', 'spoke'] },
        { q: 'If it rains, I ___ stay home.', answer: 'will', wrongs: ['would', 'shall', 'should'] },
        { q: 'The cat is ___ than the dog.', answer: 'smaller', wrongs: ['small', 'smallest', 'more small'] },
        { q: 'I have ___ been to London.', answer: 'never', wrongs: ['ever', 'always', 'sometimes'] },
        { q: 'She ___ her homework before dinner.', answer: 'does', wrongs: ['do', 'doing', 'done'] },
        { q: 'There ___ many books on the table.', answer: 'are', wrongs: ['is', 'was', 'be'] },
        { q: 'He is the ___ student in the class.', answer: 'tallest', wrongs: ['taller', 'tall', 'more tall'] },
        { q: 'We ___ to the cinema last weekend.', answer: 'went', wrongs: ['go', 'goes', 'going'] },
        { q: 'She ___ reading when I called.', answer: 'was', wrongs: ['is', 'were', 'been'] },
        { q: 'The sun ___ in the east.', answer: 'rises', wrongs: ['rise', 'rising', 'rose'] },
        { q: 'I ___ like to have some water.', answer: 'would', wrongs: ['will', 'shall', 'can'] },
        { q: 'They have ___ lived here for ten years.', answer: 'already', wrongs: ['yet', 'still', 'just'] },
        { q: 'She can ___ very fast.', answer: 'run', wrongs: ['runs', 'running', 'ran'] },
        { q: 'We ___ our grandparents every Sunday.', answer: 'visit', wrongs: ['visits', 'visiting', 'visited'] },
      ];

      const hardSentences = [
        { q: 'If I ___ rich, I would travel the world.', answer: 'were', wrongs: ['was', 'am', 'be'] },
        { q: 'The letter ___ by the time I arrived.', answer: 'had been sent', wrongs: ['has sent', 'was sending', 'is sent'] },
        { q: 'Neither Tom ___ Jerry was at the party.', answer: 'nor', wrongs: ['or', 'and', 'but'] },
        { q: 'She asked me where I ___ going.', answer: 'was', wrongs: ['am', 'is', 'were'] },
        { q: 'The project must ___ by Friday.', answer: 'be completed', wrongs: ['complete', 'completing', 'completed'] },
        { q: 'I wish I ___ harder last year.', answer: 'had studied', wrongs: ['studied', 'study', 'have studied'] },
        { q: 'By next month, she ___ here for two years.', answer: 'will have worked', wrongs: ['works', 'worked', 'has worked'] },
        { q: 'The book, ___ was on the table, is mine.', answer: 'which', wrongs: ['who', 'whom', 'what'] },
        { q: 'Not only ___ he smart, but also hardworking.', answer: 'is', wrongs: ['was', 'are', 'does'] },
        { q: 'She ___ to the doctor if she feels worse.', answer: 'will go', wrongs: ['goes', 'went', 'going'] },
      ];

      const pool = difficulty === 'easy' ? easyWords : difficulty === 'medium' ? mediumSentences : hardSentences;
      const shuffledPool = shuffleArray([...pool]);

      for (let i = 0; i < count; i++) {
        const item = shuffledPool[i % shuffledPool.length];
        const q = createEmptyQuestion();

        if (difficulty === 'easy') {
          const w = item as typeof easyWords[0];
          q.question_text = `What is "${w.word}"?`;
          const allOpts = shuffleArray([w.answer, ...w.wrongs]);
          q.options = allOpts;
          q.correct_answer = w.answer;
        } else {
          const s = item as typeof mediumSentences[0];
          q.question_text = s.q;
          const allOpts = shuffleArray([s.answer, ...s.wrongs]);
          q.options = allOpts;
          q.correct_answer = s.answer;
        }
        q.question_type = 'multiple_choice';
        generated.push(q);
      }
    }

    return generated;
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      if (genMethod === 'template') {
        const generated = generateTemplateQuestions(genSubject, genCount, genDifficulty);
        setQuestions(prev => [...prev, ...generated]);
        setActiveQuestionIndex(questions.length);
        toast({ title: 'Generated!', description: `${generated.length} questions added.` });
      } else {
        // AI generation via edge function
        const res = await supabase.functions.invoke('generate-questions', {
          body: { subject: genSubject, count: genCount, difficulty: genDifficulty },
        });

        if (res.error) throw res.error;
        if (res.data?.error) throw new Error(res.data.error);

        const aiQuestions: QuestionForm[] = (res.data.questions || []).map((q: any) => ({
          id: crypto.randomUUID(),
          question_text: q.question_text || '',
          question_image_url: '',
          question_type: 'multiple_choice',
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer || '',
          points: 1,
        }));

        setQuestions(prev => [...prev, ...aiQuestions]);
        setActiveQuestionIndex(questions.length);
        toast({ title: 'Generated!', description: `${aiQuestions.length} AI questions added.` });
      }
      setGeneratorOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: error.message || 'Could not generate questions.' });
    } finally {
      setGenerating(false);
    }
  };

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

  const activeQuestion = questions[activeQuestionIndex];

  if (loadingTest) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8 overflow-x-hidden">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tests')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Test' : 'Create Test'}</h1>
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
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter test title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter test description..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select value={testType} onValueChange={(v: 'practice' | 'olympiad') => setTestType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">📝 Practice (multiple attempts)</SelectItem>
                    <SelectItem value="olympiad">🏆 Olympiad (one attempt only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input id="timeLimit" type="number" min={1} value={timeLimitMinutes || ''} onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)} placeholder="No limit" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Time (optional)</Label>
                <Input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Users can see the test but can only start it after this time.</p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic">Public Test</Label>
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showResults">Show Results</Label>
                <Switch id="showResults" checked={showResults} onCheckedChange={setShowResults} />
              </div>
            </CardContent>
          </Card>

          {/* Questions list */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Questions</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setGeneratorOpen(true)}>
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                  <Button size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
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
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Question Image (optional — upload, drag, or paste from clipboard)</Label>
                  {activeQuestion.question_image_url ? (
                    <div className="relative">
                      <img src={activeQuestion.question_image_url} alt="Question" className="max-h-48 rounded-lg border" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => updateQuestion(activeQuestionIndex, { question_image_url: '' })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) handleImageUpload(activeQuestionIndex, file);
                      }}
                      tabIndex={0}
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(activeQuestionIndex, file); }} />
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm text-center">Click to upload, drag & drop, or paste from clipboard (Ctrl+V)</span>
                    </label>
                  )}
                </div>

                {/* Options for multiple choice */}
                {activeQuestion.question_type === 'multiple_choice' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Options (math symbols supported)</Label>
                      {activeQuestion.options.length < 6 && (
                        <Button variant="outline" size="sm" onClick={() => addOption(activeQuestionIndex)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {activeQuestion.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="space-y-1 border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Option {optionIndex + 1}</Label>
                            {activeQuestion.options.length > 2 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeOption(activeQuestionIndex, optionIndex)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <MathEditor
                            value={option}
                            onChange={(val) => updateOption(activeQuestionIndex, optionIndex, val)}
                            placeholder={`Option ${optionIndex + 1}`}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct answer */}
                <div className="space-y-2">
                  <Label>Correct Answer *</Label>
                  {activeQuestion.question_type === 'multiple_choice' ? (
                    <Select
                      value={activeQuestion.correct_answer}
                      onValueChange={(value) => updateQuestion(activeQuestionIndex, { correct_answer: value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                      <SelectContent>
                        {activeQuestion.options
                          .filter((o) => o.trim())
                          .map((option, index) => (
                            <SelectItem key={index} value={option}>{option}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={activeQuestion.correct_answer}
                      onChange={(e) => updateQuestion(activeQuestionIndex, { correct_answer: e.target.value })}
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
                    onChange={(e) => updateQuestion(activeQuestionIndex, { points: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/tests')}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Test' : 'Save Test'}
            </Button>
          </div>
        </div>
      </div>

      {/* Question Generator Dialog */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Question Generator
            </DialogTitle>
            <DialogDescription>Generate questions automatically using templates or AI</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={genSubject} onValueChange={(v: 'math' | 'english') => setGenSubject(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">📐 Mathematics</SelectItem>
                  <SelectItem value="english">📖 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={genMethod} onValueChange={(v: 'template' | 'ai') => setGenMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">📋 Template (instant, predictable)</SelectItem>
                  <SelectItem value="ai">🤖 AI Generated (diverse, slower)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Input type="number" min={1} max={50} value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value) || 5)} />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={genDifficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setGenDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneratorOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
