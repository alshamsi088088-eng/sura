import { useCallback, useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';
import { trackEvent } from '../lib/analytics';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showEditButton?: boolean;
  onAvatarChange?: (url: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 1024;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarUpload({ size = 'md', showEditButton = true, onAvatarChange }: AvatarUploadProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-16 w-16 text-lg',
    lg: 'h-24 w-24 text-2xl',
    xl: 'h-32 w-32 text-3xl'
  };

  const buttonSizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-1.5 text-sm',
    lg: 'p-2 text-base',
    xl: 'p-2.5 text-lg'
  };

  const isArabic = locale === 'ar';

  // Reset states when user changes
  useEffect(() => {
    setError(null);
    setSuccess(false);
    setPreview(null);
    setCropMode(false);
  }, [user?.id]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return isArabic ? 'صيغة غير مدعومة. استخدم jpg أو png أو webp.' : 'Unsupported format. Use jpg, png, or webp.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return isArabic ? 'حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت.' : 'File too large. Maximum 2MB.';
    }
    return null;
  }, [isArabic]);

  const processImage = useCallback(async (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) {
          resolve(null);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Calculate square crop from center
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        // Scale to max dimension
        const scale = Math.min(1, MAX_DIMENSION / sourceSize);
        const destSize = sourceSize * scale;
        const destWidth = Math.round(destSize);
        const destHeight = Math.round(destSize);

        canvas.width = destWidth;
        canvas.height = destHeight;

        // Clear and draw cropped square
        ctx.clearRect(0, 0, destWidth, destHeight);
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,
          0, 0, destWidth, destHeight
        );

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.85 // compress quality
        );
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const uploadToSupabase = useCallback(async (blob: Blob, oldUrl: string | undefined): Promise<string | null> => {
    if (!user?.id || !supabase) {
      setError(isArabic ? 'المستخدم غير مصادق عليه.' : 'User not authenticated.');
      return null;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setProgress(90);

      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      setProgress(100);

      // Delete old avatar from storage if exists and different
      if (oldUrl && oldUrl !== publicUrl) {
        try {
          // Extract path from old URL
          const oldPathMatch = oldUrl.match(/avatars\/(.+)$/);
          if (oldPathMatch) {
            await supabase.storage.from('avatars').remove([oldPathMatch[1]]);
          }
        } catch {
          // Ignore deletion errors
        }
      }

      setSuccess(true);
      trackEvent('avatar_upload', { user_id: user.id });

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      return publicUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(isArabic ? `فشل الرفع: ${message}` : `Upload failed: ${message}`);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user?.id, supabase, isArabic]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Process and preview
    const blob = await processImage(file);
    if (!blob) {
      setError(isArabic ? 'فشل معالجة الصورة.' : 'Failed to process image.');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(blob);
    setPreview(previewUrl);

    // Upload directly (skip crop UI for now, can add later)
    const url = await uploadToSupabase(blob, user?.avatar);
    if (url && onAvatarChange) {
      onAvatarChange(url);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFile, processImage, uploadToSupabase, user?.avatar, onAvatarChange, isArabic]);

  const handleDelete = useCallback(async () => {
    if (!user?.id || !supabase || !user.avatar) return;

    setUploading(true);
    setError(null);

    try {
      // Remove from Supabase Storage
      const oldPathMatch = user.avatar.match(/avatars\/(.+)$/);
      if (oldPathMatch) {
        await supabase.storage.from('avatars').remove([oldPathMatch[1]]);
      }

      // Clear from user metadata
      await supabase.auth.updateUser({
        data: { avatar: null }
      });

      // Also explicitly remove from local state
      setPreview(null);
      if (onAvatarChange) {
        onAvatarChange('');
      }

      trackEvent('avatar_delete', { user_id: user.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(isArabic ? `فشل الحذف: ${message}` : `Delete failed: ${message}`);
    } finally {
      setUploading(false);
    }
  }, [user?.id, user?.avatar, supabase, onAvatarChange, isArabic]);

  const displayUrl = preview || user?.avatar || null;
  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="relative inline-block">
      <canvas ref={canvasRef} className="hidden" />

      {/* Avatar Display */}
      <div className={`relative rounded-full overflow-hidden bg-sura-sky/20 ${sizeClasses[size]}`}>
        {displayUrl ? (
          <img
            src={`${displayUrl}?t=${Date.now()}`}
            alt={user?.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-sura-sky/20 text-sura-navy font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Edit Button */}
      {showEditButton && user && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-sura-navy/60 text-white opacity-0 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50`}
            style={{ position: 'absolute', inset: 0 }}
          >
            {uploading ? (
              <svg className="h-1/2 w-1/2 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 23h-20M12 8v8M8 12h8" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Status Messages */}
      {error && (
        <div className="absolute -bottom-6 left-0 whitespace-nowrap text-xs text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="absolute -bottom-6 left-0 whitespace-nowrap text-xs text-green-500">
          {isArabic ? 'تم التحديث!' : 'Updated!'}
        </div>
      )}

      {/* Progress Bar */}
      {uploading && progress > 0 && progress < 100 && (
        <div className="absolute -bottom-6 left-0 right-0">
          <div className="h-1 w-full overflow-hidden rounded-full bg-sura-navy/20">
            <div
              className="h-full bg-sura-teal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Delete Button (when has avatar) */}
      {showEditButton && user?.avatar && !uploading && (
        <button
          onClick={handleDelete}
          className={`${buttonSizeClasses[size]} absolute -bottom-6 right-0 rounded-full bg-red-500/80 text-white hover:bg-red-600`}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Avatar displayOnly component (for comments, author cards, etc.)
 */
interface AvatarProps {
  url?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-xl',
  xl: 'h-20 w-20 text-2xl'
};

export function Avatar({ url, name, size = 'md' }: AvatarProps) {
  const sizeClass = avatarSizes[size] || avatarSizes.md;
  const initials = name?.charAt(0) || '?';

  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-sura-sky/20 ${sizeClass}`}>
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sura-navy font-bold">
          {initials}
        </div>
      )}
    </div>
  );
}