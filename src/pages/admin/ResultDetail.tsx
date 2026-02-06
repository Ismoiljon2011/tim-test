import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MathRenderer } from '@/components/math/MathRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  time_taken_seconds: number;
  answers: Record<string, string>;
  test: {
    id: string;
    title: string;
  };
}

interface Profile {
  username: string;
  display_name: string | null;
}

export default function ResultDetail() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [result, setResult] = useState<TestResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) {
      fetchResultData();
    }
  }, [resultId]);

  const fetchResultData = async () => {
    try {
      // Fetch result
      const { data: resultData, error } = await supabase
        .from('test_results')
        .select(`
          id,
          score,
          max_score,
          completed_at,
          time_taken_seconds,
          answers,
          user_id,
          test:tests(id, title)
        `)
        .eq('id', resultId)
        .single();

      if (error) throw error;
      setResult(resultData as unknown as TestResult);

      // Fetch questions for this test
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', (resultData.test as any).id)
        .order('order_index', { ascending: true });

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options: q.options as string[] | null
        })));
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', resultData.user_id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      navigate('/admin/results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container py-8">
        <p>Result not found</p>
      </div>
    );
  }

  const percentage = (result.score / result.max_score) * 100;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/results')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Result Details</h1>
          <p className="text-muted-foreground">{result.test?.title}</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{profile?.display_name || profile?.username || 'Unknown'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-2xl font-bold">{result.score}/{result.max_score}</p>
              <Progress value={percentage} className="h-2 mt-2" />
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
                <p className="font-medium">{formatTime(result.time_taken_seconds)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-medium">{formatDate(result.completed_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Questions & Answers</h2>
        {questions.map((question, index) => {
          const userAnswer = result.answers[question.id] || '';
          const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

          return (
            <Card key={question.id} className={isCorrect ? 'border-success/50' : 'border-destructive/50'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span className="flex-1">
                      {question.question_text ? (
                        <MathRenderer latex={question.question_text} />
                      ) : (
                        'Image question'
                      )}
                    </span>
                  </CardTitle>
                  <Badge variant={isCorrect ? 'default' : 'destructive'} className={isCorrect ? 'bg-success' : ''}>
                    {isCorrect ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Correct
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Incorrect
                      </>
                    )}
                  </Badge>
                </div>
                {question.question_image_url && (
                  <img
                    src={question.question_image_url}
                    alt="Question"
                    className="max-h-48 rounded-lg mt-2"
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={`p-4 rounded-lg ${isCorrect ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className="text-sm text-muted-foreground mb-1">User's Answer</p>
                    <p className="font-medium">
                      {userAnswer ? (
                        <MathRenderer latex={userAnswer} />
                      ) : (
                        <span className="text-muted-foreground italic">No answer</span>
                      )}
                    </p>
                  </div>
                  {!isCorrect && (
                    <div className="p-4 rounded-lg bg-success/10">
                      <p className="text-sm text-muted-foreground mb-1">Correct Answer</p>
                      <p className="font-medium">
                        <MathRenderer latex={question.correct_answer} />
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Points: {isCorrect ? question.points : 0}/{question.points}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
