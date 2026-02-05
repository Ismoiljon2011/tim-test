import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trophy, Clock, Calendar, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  time_taken_seconds: number;
  user: {
    username: string;
    display_name: string | null;
  } | null;
  test: {
    title: string;
  } | null;
}

interface Test {
  id: string;
  title: string;
}

export default function AdminResults() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [leaderboardCount, setLeaderboardCount] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all tests
      const { data: testsData } = await supabase
        .from('tests')
        .select('id, title')
        .order('title');

      if (testsData) {
        setTests(testsData);
      }

      // Fetch all results with user and test info
      const { data: resultsData } = await supabase
        .from('test_results')
        .select(`
          id,
          score,
          max_score,
          completed_at,
          time_taken_seconds,
          user_id,
          test:tests(title)
        `)
        .order('completed_at', { ascending: false });

      if (resultsData) {
        // Fetch profiles separately since there's no direct FK
        const userIds = [...new Set(resultsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        const enrichedResults = resultsData.map(r => ({
          ...r,
          user: profilesMap.get(r.user_id) || null,
        }));
        
        setResults(enrichedResults as unknown as TestResult[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.test?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTest = selectedTest === 'all' || result.test?.title === selectedTest;
    
    return matchesSearch && matchesTest;
  });

  // Leaderboard: top N performers sorted by score, then by time
  const leaderboard = [...filteredResults]
    .sort((a, b) => {
      const scoreA = a.score / a.max_score;
      const scoreB = b.score / b.max_score;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.time_taken_seconds - b.time_taken_seconds;
    })
    .slice(0, leaderboardCount);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-warning text-warning-foreground">🥇 1st</Badge>;
    if (index === 1) return <Badge variant="secondary">🥈 2nd</Badge>;
    if (index === 2) return <Badge className="bg-accent text-accent-foreground">🥉 3rd</Badge>;
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Results & Leaderboard</h1>
        <p className="text-muted-foreground">View all test results and top performers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or test..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTest} onValueChange={setSelectedTest}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {tests.map((test) => (
              <SelectItem key={test.id} value={test.title}>
                {test.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Leaderboard
                </CardTitle>
                <CardDescription>Top performers</CardDescription>
              </div>
              <Select
                value={leaderboardCount.toString()}
                onValueChange={(v) => setLeaderboardCount(parseInt(v))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No results yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getRankBadge(index)}
                      <div>
                        <p className="font-medium text-sm">
                          {result.user?.display_name || result.user?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">{result.test?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getScoreColor(result.score, result.max_score)}`}>
                        {((result.score / result.max_score) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(result.time_taken_seconds)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Results Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Results</CardTitle>
            <CardDescription>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : filteredResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No results found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          {result.user?.display_name || result.user?.username || 'Unknown'}
                        </TableCell>
                        <TableCell>{result.test?.title || 'Unknown'}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${getScoreColor(result.score, result.max_score)}`}>
                            {result.score}/{result.max_score}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            ({((result.score / result.max_score) * 100).toFixed(0)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(result.time_taken_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(result.completed_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
