import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Trophy, Users, Sparkles, CheckCircle, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function Index() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) setPosts(data);
  };

  const features = [
    {
      icon: BookOpen,
      title: t('home.richMath'),
      description: t('home.richMathDesc'),
    },
    {
      icon: Trophy,
      title: t('home.instantResults'),
      description: t('home.instantResultsDesc'),
    },
    {
      icon: Users,
      title: t('home.multiUser'),
      description: t('home.multiUserDesc'),
    },
  ];

  const benefits = [
    t('feature.visualEditor'),
    t('feature.imageSupport'),
    t('feature.realTimeProgress'),
    t('feature.adminDashboard'),
    t('feature.darkMode'),
    t('feature.responsive'),
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t('home.tagline')}</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              {t('home.title1')}{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('home.title2')}
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              {t('home.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    {t('home.goToDashboard')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/auth?mode=signup">
                      {t('home.getStartedFree')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/auth">{t('nav.signIn')}</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest News/Posts Section */}
      {posts.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Newspaper className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{t('posts.latestNews')}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">{t('home.whyChoose')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.whyChooseDesc')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-sm border"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6">
                {t('home.builtFor')}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t('home.builtForDesc')}
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 lg:p-12"
            >
              <div className="bg-card rounded-2xl p-6 shadow-lg">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">∑</div>
                  <p className="text-lg font-medium mb-4">Math Expression Preview</p>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    x = (-b ± √(b² - 4ac)) / 2a
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-primary-foreground"
          >
            <h2 className="text-3xl font-bold mb-4">{t('home.readyToStart')}</h2>
            <p className="mb-8 max-w-2xl mx-auto opacity-90">
              {t('home.joinToday')}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to={user ? '/dashboard' : '/auth?mode=signup'}>
                {user ? t('home.goToDashboard') : t('home.createFreeAccount')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <span className="font-semibold">TestHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TestHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
