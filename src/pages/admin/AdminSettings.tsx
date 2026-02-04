import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>General configuration options</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Settings options will be added here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
