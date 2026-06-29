import { useState } from 'react';
import { getSupabaseOrThrow } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export function StorageUploader() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    if (!user) {
      setError('Please sign in to upload media.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(10);

    try {
      const supabase = getSupabaseOrThrow();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      setUploadedUrl(urlData.publicUrl);
      setFile(null);
      setProgress(100);
    } catch (err) {
      console.error('Upload failed', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-sura-ivory/10 bg-sura-dark/80 p-6">
      <h2 className="text-2xl font-semibold text-sura-ivory">Upload image or video</h2>
      <p className="mt-2 text-sm text-sura-ivory/70">Upload preview media to Supabase Storage for articles and pages.</p>
      <div className="mt-4 space-y-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)}
          className="w-full rounded-3xl border border-sura-border/20 bg-sura-ink/90 px-4 py-3 text-sura-ivory"
        />
        {file && <div className="text-sm text-sura-ivory/80">Selected: {file.name}</div>}
        {progress > 0 && progress < 100 && <div className="text-sm text-sura-ivory/80">Upload progress: {progress}%</div>}
        <button
          onClick={upload}
          disabled={!file || !user || uploading}
          className="rounded-full bg-sura-gold px-5 py-3 text-sm font-semibold text-sura-dark disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload media'}
        </button>
        {uploadedUrl && (
          <div className="rounded-3xl bg-black/30 p-4 text-sm text-sura-ivory/80">
            Uploaded file URL:
            <a href={uploadedUrl} target="_blank" rel="noreferrer" className="block mt-2 text-sura-gold underline">
              {uploadedUrl}
            </a>
          </div>
        )}
        {error && <div className="text-sm text-red-400">{error}</div>}
      </div>
    </section>
  );
}