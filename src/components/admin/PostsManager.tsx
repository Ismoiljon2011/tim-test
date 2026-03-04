import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function PostsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_published: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewPostDialog = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '', is_published: false });
    setDialogOpen(true);
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      is_published: post.is_published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title and content are required.' });
      return;
    }

    setSaving(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            is_published: formData.is_published,
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        toast({ title: 'Post updated!' });
      } else {
        const { error } = await supabase
          .from('posts')
          .insert({
            title: formData.title.trim(),
            content: formData.content.trim(),
            is_published: formData.is_published,
            created_by: user?.id,
          });

        if (error) throw error;
        toast({ title: 'Post created!' });
      }

      setDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save post.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPostId) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', deletingPostId);
      if (error) throw error;
      toast({ title: 'Post deleted!' });
      fetchPosts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete post.' });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingPostId(null);
    }
  };

  const togglePublished = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_published: !post.is_published })
        .eq('id', post.id);
      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('posts.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('posts.manageHomepage')}</p>
        </div>
        <Button onClick={openNewPostDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('posts.newPost')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg">{t('posts.noPosts')}</p>
            <p className="text-sm">{t('posts.createFirst')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <Badge variant={post.is_published ? 'default' : 'secondary'}>
                        {post.is_published ? t('posts.published') : t('posts.draft')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(post.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => togglePublished(post)} title={post.is_published ? 'Unpublish' : 'Publish'}>
                      {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setDeletingPostId(post.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPost ? t('posts.editPost') : t('posts.newPost')}</DialogTitle>
            <DialogDescription>
              {editingPost ? 'Edit your post content' : 'Create a new post for the homepage'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('posts.postTitle')}</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter post title..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t('posts.content')}</Label>
              <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Enter post content..." rows={5} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_published">{t('posts.published')}</Label>
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('adminUsers.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : t('posts.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('adminUsers.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('posts.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
