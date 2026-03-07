import { useState, useEffect } from 'react';
import { PostsManager } from '@/components/admin/PostsManager';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [supportUrl, setSupportUrl] = useState('');
  const [savingSupport, setSavingSupport] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('platform_settings' as any)
      .select('key, value');
    
    if (data) {
      const settings = data as any[];
      const support = settings.find((s: any) => s.key === 'support_url');
      if (support) setSupportUrl(support.value);
    }
  };

  const handleSaveSupportUrl = async () => {
    setSavingSupport(true);
    try {
      const { error } = await supabase
        .from('platform_settings' as any)
        .upsert({ key: 'support_url', value: supportUrl.trim(), updated_at: new Date().toISOString() } as any, { onConflict: 'key' });

      if (error) throw error;
      toast({ title: 'Saved', description: 'Support URL updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSavingSupport(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('admin.settings')}</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      <div className="space-y-8">
        {/* Support URL Setting (Super Admin only) */}
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Support Link
              </CardTitle>
              <CardDescription>Configure the support button URL that users see on their profile page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="support-url">Support URL</Label>
                  <Input
                    id="support-url"
                    value={supportUrl}
                    onChange={(e) => setSupportUrl(e.target.value)}
                    placeholder="https://t.me/your_support_bot"
                  />
                </div>
                <Button onClick={handleSaveSupportUrl} disabled={savingSupport}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingSupport ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Management */}
        <PostsManager />
      </div>
    </div>
  );
}
