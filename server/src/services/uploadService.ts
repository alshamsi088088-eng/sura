import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function createUploadUrl(bucket: string, path: string, expiresInSeconds = 300) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to generate upload URLs');
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Unable to create upload URL');
  }

  return data.signedUrl;
}
