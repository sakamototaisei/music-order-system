
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

import { useRouter } from 'next/navigation';

export default function ProfileForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, newsletter')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found'
          console.error('Error fetching profile:', error);
        } else if (data) {
          setName(data.name || '');
          setNewsletter(data.newsletter || false);
        }
        setEmail(user.email || '');
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('ユーザーがログインしていません。');
      return;
    }

    setLoading(true);

    // プロフィール情報の更新
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name,
        newsletter: newsletter,
      });

    if (profileError) {
      setMessage(`プロフィールの更新に失敗しました: ${profileError.message}`);
    } else {
      setMessage('プロフィールが正常に更新されました。');
      router.push('/');
    }

    setLoading(false);
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">プロフィール編集</h2>
      {message && <div className="mb-4 text-green-500">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-800">名前</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-800">メールアドレス</label>
          <p className="mt-1 text-gray-900">{email}</p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="newsletter"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-800">
            メルマガの受信を許可する
          </label>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? '更新中...' : '更新'}
          </button>
        </div>
        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            戻る
          </button>
        </div>
      </form>
    </div>
  );
}
