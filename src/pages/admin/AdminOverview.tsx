import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Users, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Stats {
  totalTests: number;
  totalUsers: number;
  totalResults: number;
  averageScore: number;
}

export default function AdminOverview() {
  const { t } = useLanguage();
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
      title: t('admin.totalTests'),
      value: stats.totalTests,
      icon: FileText,
      description: t('admin.testsCreated'),
      color: 'text-primary',
    },
    {
      title: t('admin.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      description: t('admin.registeredUsers'),
      color: 'text-accent',
    },
    {
      title: t('admin.testResults'),
      value: stats.totalResults,
      icon: Trophy,
      description: t('admin.submissionsReceived'),
      color: 'text-success',
    },
    {
      title: t('dashboard.averageScore'),
      value: `${stats.averageScore.toFixed(1)}%`,
      icon: TrendingUp,
      description: t('dashboard.acrossAllTests'),
      color: 'text-warning',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('admin.dashboardOverview')}</h1>
        <p className="text-muted-foreground">
          {t('admin.welcomeAdmin')}
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
            <CardTitle>{t('admin.quickActions')}</CardTitle>
            <CardDescription>{t('admin.commonTasks')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/admin/tests/new"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('admin.createNewTest')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.addTestQuestions')}</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/results"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">{t('admin.viewLeaderboard')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.seeTopPerformers')}</p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/users"
              className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">{t('admin.manageUsers')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.viewManageUsers')}</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.platformStatus')}</CardTitle>
            <CardDescription>{t('admin.systemHealth')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('admin.database')}</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  {t('admin.connected')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('admin.authentication')}</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  {t('admin.active')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('admin.storage')}</span>
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="h-2 w-2 bg-success rounded-full" />
                  {t('admin.available')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
