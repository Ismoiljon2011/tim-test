import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { MathRenderer } from '@/components/math/MathRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  question_text: string | null;
  question_image_url: string | null;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  show_results: boolean;
  test_type?: string;
  starts_at?: string | null;
}

export default function TakeTest() {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [notStartedYet, setNotStartedYet] = useState(false);
  const [startsAtTime, setStartsAtTime] = useState<string | null>(null);

  useEffect(() => {
    if (testId && user) {
      checkProfileAndFetchTest();
    }
  }, [testId, user]);

  useEffect(() => {
    if (!test?.time_limit_minutes || testCompleted) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const remaining = test.time_limit_minutes! * 60 - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
        // Auto-submit the test when time runs out
        handleSubmit();
        return;
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [test, startTime, testCompleted]);

  const checkProfileAndFetchTest = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const p = profile as any;
      if (!p?.first_name || !p?.last_name || !p?.fathers_name || !p?.school || !p?.age) {
        setProfileIncomplete(true);
        setLoading(false);
        return;
      }

      await fetchTestData();
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchTestData = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('id, title, description, time_limit_minutes, show_results, test_type, starts_at')
        .eq('id', testId)
        .single();

      if (testError) throw testError;
      setTest(testData as Test);

      // Check start time
      if ((testData as any).starts_at && new Date((testData as any).starts_at) > new Date()) {
        setNotStartedYet(true);
        setStartsAtTime((testData as any).starts_at);
        setLoading(false);
        return;
      }

      // Check olympiad: already taken?
      if (testData.test_type === 'olympiad' && user) {
        const { data: existingResults } = await supabase
          .from('test_results')
          .select('id')
          .eq('test_id', testId!)
          .eq('user_id', user.id);

        if (existingResults && existingResults.length > 0) {
          setAlreadyTaken(true);
          setLoading(false);
          return;
        }
      }

      if (testData.time_limit_minutes) {
        setTimeRemaining(testData.time_limit_minutes * 60);
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId!)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;
      
      const parsedQuestions = questionsData.map(q => ({
        ...q,
        options: q.options as string[] | null
      }));
      
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({ variant: 'destructive', title: 'Error loading test', description: 'Could not load the test. Please try again.' });
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!user || !test || submitting) return;
    
    setSubmitting(true);
    setShowSubmitDialog(false);

    try {
      let score = 0;
      let maxScore = 0;

      questions.forEach((question) => {
        maxScore += question.points;
        const userAnswer = answers[question.id]?.trim().toLowerCase();
        const correctAnswer = question.correct_answer.trim().toLowerCase();
        
        if (userAnswer === correctAnswer) {
          score += question.points;
        }
      });

      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      const { error } = await supabase
        .from('test_results')
        .insert({
          test_id: test.id,
          user_id: user.id,
          score,
          max_score: maxScore,
          answers,
          started_at: startTime.toISOString(),
          time_taken_seconds: timeTaken,
        });

      if (error) throw error;

      setResult({ score, maxScore });
      setTestCompleted(true);
      
      toast({ title: 'Test submitted!', description: 'Your answers have been recorded.' });
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({ variant: 'destructive', title: 'Submission failed', description: 'Could not submit your answers. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [user, test, answers, questions, startTime, submitting, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <AlertCircle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Profile Incomplete</h1>
            <p className="text-muted-foreground mb-6">
              Please fill in your personal information (First Name, Last Name, Father's Name, School, Age) before starting a test.
            </p>
            <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (notStartedYet) {
    return (
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <CalendarClock className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Test Not Available Yet</h1>
            <p className="text-muted-foreground mb-6">
              This test starts at: <strong>{startsAtTime ? new Date(startsAtTime).toLocaleString() : '—'}</strong>
            </p>
            <Button onClick={() => navigate('/tests')}>Back to Tests</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Olympiad Already Completed</h1>
            <p className="text-muted-foreground mb-6">
              This is an Olympiad test and can only be taken once. You have already completed it.
            </p>
            <Button onClick={() => navigate('/tests')}>Back to Tests</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (testCompleted && result) {
    const percentage = (result.score / result.maxScore) * 100;

    return (
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Test Completed!</h1>
              <p className="text-muted-foreground">{test?.title}</p>
            </div>

            {test?.show_results && (
              <div className="space-y-4 mb-8">
                <div className="text-5xl font-bold">
                  {result.score}/{result.maxScore} <span className="text-2xl font-medium text-muted-foreground">points</span>
                </div>
                <div className="text-2xl text-muted-foreground">{percentage.toFixed(0)}%</div>
                <Progress value={percentage} className="h-3" />
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/tests')}>Back to Tests</Button>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{test?.title}</h1>
            <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 60 ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{answeredCount} answered</span>
            <span>{questions.length - answeredCount} remaining</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      {currentQuestionIndex + 1}
                    </span>
                    <div className="flex-1">
                      {currentQuestion?.question_text && (
                        <div className="mb-4"><MathRenderer latex={currentQuestion.question_text} /></div>
                      )}
                      {currentQuestion?.question_image_url && (
                        <img src={currentQuestion.question_image_url} alt="Question" className="max-w-full rounded-lg mt-4" />
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentQuestion?.question_type === 'multiple_choice' && currentQuestion.options ? (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        htmlFor={`option-${index}`}
                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          answers[currentQuestion.id] === option ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <span className="flex-1"><MathRenderer latex={option} /></span>
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input
                    value={answers[currentQuestion?.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Enter your answer..."
                    className="text-lg"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>

          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-md text-sm transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[questions[index].id]
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={() => setShowSubmitDialog(true)} disabled={submitting}>Submit Test</Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Submit Test?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {answeredCount} out of {questions.length} questions.
                {answeredCount < questions.length && (
                  <span className="block mt-2 text-warning">
                    Warning: You have {questions.length - answeredCount} unanswered questions.
                  </span>
                )}
                Are you sure you want to submit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Test</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
