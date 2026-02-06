import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PostsManager } from '@/components/admin/PostsManager';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminSettings() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('admin.settings')}</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      <div className="space-y-8">
        {/* Posts Management */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.posts')}</CardTitle>
            <CardDescription>{t('admin.managePosts')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PostsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
