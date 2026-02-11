import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, Users, Lock, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Test {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  time_limit_minutes: number | null;
  created_at: string;
  question_count?: number;
  test_type?: string;
}

export default function Tests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests] = useState<Test[]>([]);
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) fetchTests();
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;

    try {
      const { data: publicTests } = await supabase
        .from('tests')
        .select('id, title, description, is_public, time_limit_minutes, created_at, test_type')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicTests) {
        const testsWithCounts = await Promise.all(
          publicTests.map(async (test: any) => {
            const { count } = await supabase
              .from('questions')
              .select('id', { count: 'exact', head: true })
              .eq('test_id', test.id);
            return { ...test, question_count: count || 0 };
          })
        );
        setTests(testsWithCounts);
      }

      const { data: assignments } = await supabase
        .from('test_assignments')
        .select(`test:tests(id, title, description, is_public, time_limit_minutes, created_at, test_type)`)
        .eq('user_id', user.id);

      if (assignments) {
        const assignedTestsData = assignments
          .map((a: any) => a.test)
          .filter((t: any): t is Test => t !== null && !t.is_public);
        
        const assignedWithCounts = await Promise.all(
          assignedTestsData.map(async (test: any) => {
            const { count } = await supabase
              .from('questions')
              .select('id', { count: 'exact', head: true })
              .eq('test_id', test.id);
            return { ...test, question_count: count || 0 };
          })
        );
        setAssignedTests(assignedWithCounts);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTests = (testList: Test[]) =>
    testList.filter((test) =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const olympiadTests = filterTests(tests.filter(t => t.test_type === 'olympiad'));
  const practiceTests = filterTests(tests.filter(t => !t.test_type || t.test_type === 'practice'));
  const filteredAssignedTests = filterTests(assignedTests);

  const TestCard = ({ test, isAssigned = false }: { test: Test; isAssigned?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="h-full hover:shadow-md transition-shadow border-2 hover:border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{test.title}</CardTitle>
            <div className="flex gap-1">
              {isAssigned && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />{t('tests.assigned')}
                </Badge>
              )}
              {test.test_type === 'olympiad' && (
                <Badge className="bg-warning text-warning-foreground">🏆</Badge>
              )}
            </div>
          </div>
          <CardDescription className="line-clamp-2">{test.description || 'No description provided'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />{test.question_count || 0} {t('tests.questions')}
            </div>
            {test.time_limit_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />{test.time_limit_minutes} {t('tests.minutes')}
              </div>
            )}
          </div>
          <Button asChild className="w-full">
            <Link to={`/tests/${test.id}`}>{t('tests.startTest')}<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('tests.availableTests')}</h1>
          <p className="text-muted-foreground">{t('tests.browseTests')}</p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('tests.searchTests')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {/* Assigned Tests */}
        {filteredAssignedTests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />{t('tests.assignedToYou')}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssignedTests.map((test) => (<TestCard key={test.id} test={test} isAssigned />))}
            </div>
          </div>
        )}

        {/* Tabs for Olympiad and Practice */}
        <Tabs defaultValue="practice" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> {t('tests.practice')} ({practiceTests.length})
            </TabsTrigger>
            <TabsTrigger value="olympiad" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" /> {t('tests.olympiad')} ({olympiadTests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (<Card key={i} className="h-48 animate-pulse bg-muted" />))}
              </div>
            ) : practiceTests.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {practiceTests.map((test) => (<TestCard key={test.id} test={test} />))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center text-muted-foreground">
                  <p className="text-lg">{t('tests.noTests')}</p>
                  <p className="text-sm">{t('tests.adjustSearch')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="olympiad">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (<Card key={i} className="h-48 animate-pulse bg-muted" />))}
              </div>
            ) : olympiadTests.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {olympiadTests.map((test) => (<TestCard key={test.id} test={test} />))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center text-muted-foreground">
                  <p className="text-lg">{t('tests.noOlympiads')}</p>
                  <p className="text-sm">{t('tests.adjustSearch')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
