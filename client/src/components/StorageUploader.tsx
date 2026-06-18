import { useState } from 'react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, storage } from '../firebaseConfig';

export function StorageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');

  const upload = async () => {
    if (!file) return;
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to upload media.');
      return;
    }
    setError('');
    const fileRef = ref(storage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
    const task = uploadBytesResumable(fileRef, file);

    task.on('state_changed', (snapshot) => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      setProgress(percent);
    }, (uploadError) => {
      console.error('Upload failed', uploadError);
      setError('Upload failed. Please try again.');
    }, async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      setUploadedUrl(url);
      setFile(null);
    });
  };

  return (
    <section className="rounded-3xl border border-sura-ivory/10 bg-sura-dark/80 p-6">
      <h2 className="text-2xl font-semibold text-sura-ivory">Upload image or video</h2>
      <p className="mt-2 text-sm text-sura-ivory/70">Upload preview media to Firebase Storage for articles and pages.</p>
      <div className="mt-4 space-y-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)}
          className="w-full rounded-3xl border border-sura-border/20 bg-sura-ink/90 px-4 py-3 text-sura-ivory"
        />
        {file && <div className="text-sm text-sura-ivory/80">Selected: {file.name}</div>}
        {progress > 0 && <div className="text-sm text-sura-ivory/80">Upload progress: {progress}%</div>}
        <button onClick={upload} disabled={!file} className="rounded-full bg-sura-gold px-5 py-3 text-sm font-semibold text-sura-dark disabled:opacity-50">
          Upload media
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
