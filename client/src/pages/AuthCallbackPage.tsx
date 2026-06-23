import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function getCallbackParams(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get('code');
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  const state = params.get('state');
  return { code, error, errorDescription, state };
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Supabase client is not initialized.');
        return;
      }

      const { code, error, errorDescription } = getCallbackParams(location.search);

      if (error) {
        if (!isMounted) return;
        setStatus('error');
        setMessage(errorDescription || error);
        return;
      }

      // For OAuth redirect, Supabase typically uses `code` query param.
      if (code) {
        setMessage('Completing sign-in...');

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          // Supabase expects the current URL (or the URL containing the code)
          window.location.href
        );

        if (!isMounted) return;

        if (exchangeError) {
          setStatus('error');
          setMessage(exchangeError.message);
          return;
        }

        if (!data?.session) {
          setStatus('error');
          setMessage('No session returned after authentication.');
          return;
        }

        navigate('/dashboard', { replace: true });
        return;
      }

      // Some flows might not use `code` query param; still attempt exchange.
      setMessage('Completing sign-in...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (!isMounted) return;

      if (exchangeError) {
        setStatus('error');
        setMessage(exchangeError.message);
        return;
      }

      if (!data?.session) {
        setStatus('error');
        setMessage('No session returned after authentication.');
        return;
      }

      navigate('/dashboard', { replace: true });
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(560px, 92vw)', padding: 16, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>
          {status === 'loading' ? 'Auth Callback' : 'Authentication Failed'}
        </h1>
        <p style={{ marginBottom: 16, color: status === 'error' ? '#b00020' : undefined }}>{message}</p>

        {status === 'error' && (
          <button
            onClick={() => navigate('/login', { replace: true })}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.15)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
