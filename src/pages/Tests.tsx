import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, Users, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Test {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  time_limit_minutes: number | null;
  created_at: string;
  question_count?: number;
}

export default function Tests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;

    try {
      // Fetch public tests
      const { data: publicTests } = await supabase
        .from('tests')
        .select('id, title, description, is_public, time_limit_minutes, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicTests) {
        // Fetch question counts for each test
        const testsWithCounts = await Promise.all(
          publicTests.map(async (test) => {
            const { count } = await supabase
              .from('questions')
              .select('id', { count: 'exact', head: true })
              .eq('test_id', test.id);
            return { ...test, question_count: count || 0 };
          })
        );
        setTests(testsWithCounts);
      }

      // Fetch assigned tests
      const { data: assignments } = await supabase
        .from('test_assignments')
        .select(`
          test:tests(id, title, description, is_public, time_limit_minutes, created_at)
        `)
        .eq('user_id', user.id);

      if (assignments) {
        const assignedTestsData = assignments
          .map((a) => a.test)
          .filter((t): t is Test => t !== null && !t.is_public);
        
        // Fetch question counts for assigned tests
        const assignedWithCounts = await Promise.all(
          assignedTestsData.map(async (test) => {
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

  const filteredTests = tests.filter((test) =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignedTests = assignedTests.filter((test) =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TestCard = ({ test, isAssigned = false }: { test: Test; isAssigned?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{test.title}</CardTitle>
            {isAssigned && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Assigned
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {test.description || 'No description provided'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {test.question_count || 0} questions
            </div>
            {test.time_limit_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {test.time_limit_minutes} min
              </div>
            )}
          </div>
          <Button asChild className="w-full">
            <Link to={`/tests/${test.id}`}>
              Start Test
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Tests</h1>
          <p className="text-muted-foreground">
            Browse and take tests to improve your skills
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Assigned Tests */}
        {filteredAssignedTests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Assigned to You
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssignedTests.map((test) => (
                <TestCard key={test.id} test={test} isAssigned />
              ))}
            </div>
          </div>
        )}

        {/* Public Tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Public Tests</h2>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center text-muted-foreground">
                <p className="text-lg">No tests found</p>
                <p className="text-sm">Try adjusting your search query</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
