import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalTests: number;
  totalUsers: number;
  totalResults: number;
  averageScore: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    totalUsers: 0,
    totalResults: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [testsCount, usersCount, resultsData] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('test_results').select('score, max_score'),
      ]);

      const results = resultsData.data || [];
      const averageScore = results.length > 0
        ? results.reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) / results.length
        : 0;

      setStats({
        totalTests: testsCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalResults: results.length,
        averageScore,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tests',
      value: stats.totalTests,
      icon: FileText,
      description: 'Tests created',
      color: 'text-primary',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Registered users',
      color: 'text-accent',
    },
    {
      title: 'Test Results',
      value: stats.totalResults,
      icon: Trophy,
      description: 'Submissions received',
      color: 'text-success',
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Across all tests',
      color: 'text-warning',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the admin panel. Here's a summary of your platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/tests"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Create New Test</p>
                  <p className="text-sm text-muted-foreground">Add a new test with questions</p>
                </div>
              </div>
            </a>
            <a
              href="/admin/results"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">View Leaderboard</p>
                  <p className="text-sm text-muted-foreground">See top performers</p>
                </div>
              </div>
            </a>
            <a
              href="/admin/users"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View and manage user accounts</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>System health and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  Available
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
