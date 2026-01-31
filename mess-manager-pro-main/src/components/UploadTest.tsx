import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { debugUpload } from '@/lib/debug-upload';
import { Upload, Loader2 } from 'lucide-react';

export function UploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState('mess-manager/test');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting manual upload test...');
      const uploadResult = await debugUpload(file, folder);
      
      setResult(uploadResult);
      toast.success('Upload successful!');
      console.log('✅ Upload completed:', uploadResult);
      
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.info(`Selected: ${selectedFile.name} (${selectedFile.size} bytes)`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testFile">Select File</Label>
          <Input
            id="testFile"
            type="file"
            accept="image/*,.pdf,text/*"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="testFolder">Folder</Label>
          <Input
            id="testFolder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="mess-manager/test"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleTestUpload} 
            disabled={!file || uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Test Upload
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setFile(null);
              setResult(null);
              setFolder('mess-manager/test');
            }}
          >
            Clear
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Upload Result:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>File ID:</strong> {result.id}</p>
              <p><strong>Name:</strong> {result.name}</p>
              <p><strong>Size:</strong> {result.size} bytes</p>
              <p><strong>Type:</strong> {result.mimeType}</p>
              <p><strong>View Link:</strong> <a href={result.webViewLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open</a></p>
              <p><strong>Direct Link:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download</a></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}