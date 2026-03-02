import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Clock, ArrowRight, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  time_taken_seconds: number;
  test: {
    title: string;
  };
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
}

const CHART_COLORS = [
  'hsl(142, 71%, 45%)',  // green - excellent
  'hsl(217, 91%, 60%)',  // blue - good
  'hsl(38, 92%, 50%)',   // amber - average
  'hsl(0, 84%, 60%)',    // red - poor
];

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-popover-foreground">{label}</p>
        <p className="text-primary font-bold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-popover-foreground">{payload[0].name}</p>
        <p style={{ color: payload[0].payload.fill }} className="font-bold">{payload[0].value} test(s)</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [allResults, setAllResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState({ totalTests: 0, averageScore: 0, totalTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: results } = await supabase
        .from('test_results')
        .select(`id, score, max_score, completed_at, time_taken_seconds, test:tests(title)`)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (results) {
        setAllResults(results as unknown as TestResult[]);
        setRecentResults((results as unknown as TestResult[]).slice(0, 5));
        
        const totalTests = results.length;
        const averageScore = totalTests > 0
          ? results.reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) / totalTests
          : 0;
        const totalTime = results.reduce((acc, r) => acc + r.time_taken_seconds, 0);
        setStats({ totalTests, averageScore, totalTime });
      }

      const { data: tests } = await supabase
        .from('tests')
        .select('id, title, description, time_limit_minutes')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (tests) setAvailableTests(tests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const barChartData = useMemo(() => {
    return allResults.slice(0, 10).reverse().map((r) => ({
      name: r.test.title.length > 12 ? r.test.title.slice(0, 12) + '…' : r.test.title,
      score: Math.round((r.score / r.max_score) * 100),
    }));
  }, [allResults]);

  const pieChartData = useMemo(() => {
    if (allResults.length === 0) return [];
    let excellent = 0, good = 0, average = 0, poor = 0;
    allResults.forEach((r) => {
      const pct = (r.score / r.max_score) * 100;
      if (pct >= 80) excellent++;
      else if (pct >= 60) good++;
      else if (pct >= 40) average++;
      else poor++;
    });
    return [
      { name: '⭐ 80-100%', value: excellent, label: 'A\'lo' },
      { name: '👍 60-79%', value: good, label: 'Yaxshi' },
      { name: '📝 40-59%', value: average, label: 'O\'rta' },
      { name: '📚 0-39%', value: poor, label: 'Mashq qiling' },
    ].filter(d => d.value > 0);
  }, [allResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcomeBack')}</h1>
          <p className="text-muted-foreground">{t('dashboard.overview')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.testsCompleted')}</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTests}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.totalTests')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.averageScore')}</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.acrossAllTests')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.timeSpent')}</CardTitle>
              <Clock className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatTime(stats.totalTime)}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.totalTestingTime')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {allResults.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('dashboard.recentResults')}
                </CardTitle>
                <CardDescription>Score % per test</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="score" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Score Distribution
                </CardTitle>
                <CardDescription>How your scores are distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={4}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltipPie />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentResults')}</CardTitle>
              <CardDescription>{t('dashboard.latestSubmissions')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentResults.length > 0 ? (
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{result.test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(result.completed_at)} • {formatTime(result.time_taken_seconds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{result.score}/{result.max_score} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
                        <p className="text-sm text-muted-foreground">
                          {((result.score / result.max_score) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.noResults')}</p>
                  <p className="text-sm">{t('dashboard.takeTestToSee')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Tests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.availableTests')}</CardTitle>
                <CardDescription>{t('dashboard.testsYouCanTake')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tests">{t('dashboard.viewAll')}<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : availableTests.length > 0 ? (
                <div className="space-y-4">
                  {availableTests.map((test) => (
                    <Link
                      key={test.id}
                      to={`/tests/${test.id}`}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{test.title}</p>
                        {test.time_limit_minutes && (
                          <p className="text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />{test.time_limit_minutes} minutes
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.noTestsAvailable')}</p>
                  <p className="text-sm">{t('dashboard.checkBackLater')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Quick Access */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.adminPanel')}</h3>
                    <p className="text-sm text-muted-foreground">{t('dashboard.manageTests')}</p>
                  </div>
                  <Button asChild>
                    <Link to="/admin">{t('dashboard.openAdminPanel')}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
