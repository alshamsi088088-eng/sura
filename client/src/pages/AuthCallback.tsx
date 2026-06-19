import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // وضعنا علامة استفهام بعد supabase لتفادي فحص الـ null الصارم في لغة TypeScript
    if (!supabase) {
      navigate('/login');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/profile'); 
      } else if (event === 'INITIAL_SESSION' && !session) {
        navigate('/login'); 
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#121212] text-stone-200 font-serif">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-500 border-t-transparent mb-4"></div>
      <p className="text-md tracking-wide animate-pulse">Verifying your credentials, please wait...</p>
    </div>
  );
}
