
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const GENRE_OPTIONS = [
  'ポップス', 'ロック', 'ジャズ', 'クラシック', 'EDM', 'ヒップホップ', 'R&B', 'アコースティック', 'アンビエント'
];

interface Order {
  id: string;
  theme: string;
  instruments: string[];
  genres: string[];
  has_lyrics: boolean;
  lyrics_content: string;
  additional_notes: string;
}

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export default function EditOrderModal({ order, onClose, onOrderUpdated }: EditOrderModalProps) {
  const [theme, setTheme] = useState('');
  const [instruments, setInstruments] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [otherGenre, setOtherGenre] = useState('');
  const [hasLyrics, setHasLyrics] = useState(false);
  const [lyricsContent, setLyricsContent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (order) {
      setTheme(order.theme || '');
      setInstruments(order.instruments?.join(', ') || '');
      setHasLyrics(order.has_lyrics || false);
      setLyricsContent(order.lyrics_content || '');
      setAdditionalNotes(order.additional_notes || '');

      // Set genres
      const predefinedGenres = order.genres?.filter(g => GENRE_OPTIONS.includes(g)) || [];
      const other = order.genres?.find(g => !GENRE_OPTIONS.includes(g)) || '';
      setSelectedGenres(predefinedGenres);
      setOtherGenre(other);
    }
  }, [order]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre].slice(0, 3)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalGenres = [...selectedGenres];
    if (otherGenre.trim() !== '') {
      finalGenres.push(otherGenre.trim());
    }

    if (finalGenres.length === 0) {
      setMessage('ジャンルを1つ以上選択してください。');
      return;
    }

    setLoading(true);
    setMessage('');

    const updatedData = {
      theme,
      instruments: instruments.split(',').map(item => item.trim()),
      genres: finalGenres,
      has_lyrics: hasLyrics,
      lyrics_content: hasLyrics ? lyricsContent : null,
      additional_notes: additionalNotes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('music_orders')
      .update(updatedData)
      .eq('id', order.id);

    if (error) {
      setMessage(`エラー: ${error.message}`);
    } else {
      setMessage('オーダーを更新しました。');
      onOrderUpdated();
      setTimeout(() => onClose(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">オーダーを編集</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
          </div>
          {message && <p className="text-center text-blue-500">{message}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="theme-edit" className="text-sm font-medium text-gray-700">テーマ / コンセプト</label>
              <input id="theme-edit" type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-gray-900" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ジャンル / スタイル (3つまで選択)<span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    type="button"
                    key={genre}
                    onClick={() => handleGenreChange(genre)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <label htmlFor="otherGenre-edit" className="text-sm font-medium text-gray-700">その他 (自由入力)</label>
                <input
                  id="otherGenre-edit"
                  type="text"
                  value={otherGenre}
                  onChange={(e) => setOtherGenre(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-gray-900"
                  placeholder="選択肢にないジャンルを入力"
                  disabled={selectedGenres.length >= 3 && !selectedGenres.includes(otherGenre)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="instruments-edit" className="text-sm font-medium text-gray-700">使用楽器 (カンマ区切り)</label>
              <input id="instruments-edit" type="text" value={instruments} onChange={(e) => setInstruments(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-gray-900" />
            </div>
            <div className="flex items-center">
              <input id="hasLyrics-edit" type="checkbox" checked={hasLyrics} onChange={(e) => setHasLyrics(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label htmlFor="hasLyrics-edit" className="ml-2 block text-sm text-gray-900">歌詞あり</label>
            </div>
            {hasLyrics && (
              <div>
                <label htmlFor="lyricsContent-edit" className="text-sm font-medium text-gray-700">歌詞の内容</label>
                <textarea id="lyricsContent-edit" value={lyricsContent} onChange={(e) => setLyricsContent(e.target.value)} rows={4} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-gray-900" />
              </div>
            )}
            <div>
              <label htmlFor="additionalNotes-edit" className="text-sm font-medium text-gray-700">その他の要望</label>
              <textarea id="additionalNotes-edit" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-gray-900" />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">{loading ? '更新中...' : '更新を保存'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
