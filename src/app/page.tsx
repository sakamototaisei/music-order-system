"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import MusicOrderForm from '@/components/MusicOrderForm';
import OrderHistory from '@/components/OrderHistory';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // State to toggle

  // --- Authentication and State Management ---
  const [profileName, setProfileName] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check for the session on component mount.
    // This runs only once and ensures the initial state is set correctly,
    // resolving the Chrome reload issue.
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        setProfileName(profile?.name || '');
      }
      setIsLoading(false); // End loading after the initial check is complete.
    };

    getInitialSession();

    // 2. Set up a listener for subsequent auth state changes.
    // This handles events like login, logout in another tab, or session expiry.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
          setProfileName(profile?.name || '');
        } else {
          setProfileName('');
        }
        // Note: We don't set loading state here, as this listener handles
        // background updates, not the initial page load.
      }
    );

    // Cleanup the subscription when the component unmounts.
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Event Handlers ---
  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('確認メールを送信しました。受信トレイをご確認ください。');
      setAuthMode('login');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleAccountDelete = async () => {
    if (window.confirm('本当にアカウントを削除しますか？この操作を行うと、あなたのアカウントと全てのオーダー履歴が完全に削除され、元に戻すことはできません。')) {
      setLoading(true);
      setMessage('');
      const { error: rpcError } = await supabase.rpc('delete_current_user');
      if (rpcError) {
        setMessage(`エラーが発生しました: ${rpcError.message}`);
        setLoading(false);
      } else {
        setMessage('アカウントが正常に削除されました。ログアウトします...');
        await supabase.auth.signOut();
      }
    }
  };

  const handleOrderMutation = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div>読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-900">音楽オーダーシステム</h1>
          
          <div className="flex border-b">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-sm font-medium text-center ${authMode === 'login' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-sm font-medium text-center ${authMode === 'signup' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              サインアップ
            </button>
          </div>

          {message && <p className="text-center text-red-500">{message}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {authMode === 'signup' && (
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">ユーザー名</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" placeholder="ユーザー名" required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">メールアドレス</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" placeholder="your@email.com" required />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">パスワード</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" placeholder="••••••••" required />
            </div>
            <div className="flex flex-col space-y-4">
              <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {loading ? '読み込み中...' : (authMode === 'login' ? 'ログイン' : 'サインアップ')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-12 bg-gray-100">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 px-4">
            <h1 className="text-2xl font-bold text-gray-800">ようこそ、{profileName || 'ゲスト'}さん</h1>
            <div>
              <a href="/profile" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">プロフィール編集</a>
              <button onClick={handleLogout} disabled={loading} className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">{loading ? 'ログアウト中...' : 'ログアウト'}</button>
            </div>
          </div>
        {message && <p className="mb-4 text-center text-red-500">{message}</p>}
        
        <MusicOrderForm user={session.user} onOrderCreated={handleOrderMutation} />
        <OrderHistory user={session.user} refreshCounter={refreshCounter} onOrderMutated={handleOrderMutation} />

        {/* --- Account Deletion Section --- */}
        <div className="w-full max-w-4xl p-8 mt-8 bg-white rounded-lg shadow-md border-t-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-900">アカウント設定</h2>
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">アカウントの削除</h3>
                <p className="mt-2 text-sm text-red-700">この操作は元に戻せません。アカウントを削除すると、あなたのプロフィール情報と、これまでに作成した全ての音楽オーダー履歴が完全に削除されます。</p>
                <div className="mt-4 text-right">
                    <button 
                        onClick={handleAccountDelete}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        アカウントを完全に削除する
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}