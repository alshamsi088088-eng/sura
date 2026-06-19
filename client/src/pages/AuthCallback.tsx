import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // تأكدي أن اسم الملف هنا يطابق اسم ملف السوبابيز داخل مجلد lib

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // التقاط الجلسة تلقائياً وتحويل المستخدم
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/profile'); // سيتم تحويل المستخدم لصفحة الملف التعريفي
      } else if (event === 'INITIAL_SESSION' && !session) {
        navigate('/login'); // إذا انتهت صلاحية الرابط أو حدث خطأ سيعود لصفحة الدخول
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
