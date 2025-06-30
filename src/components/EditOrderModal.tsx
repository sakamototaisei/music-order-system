"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// MusicOrderForm.tsxからジャンルデータをコピー
const genreData = [
    {
        "name": "ロック",
        "subgenres": ["ハードロック", "パンクロック", "オルタナティヴロック", "プログレッシブロック", "インディーロック", "グランジ", "ガレージロック", "サイケデリックロック"]
    },
    {
        "name": "ポップ",
        "subgenres": ["ティーンポップ", "ダンスポップ", "シンセポップ", "ドリームポップ", "J-POP", "K-POP", "シティポップ"]
    },
    {
        "name": "エレクトロニック / EDM",
        "subgenres": ["テクノ", "ハウス", "トランス", "ダブステップ", "ドラムンベース", "エレクトロポップ", "フューチャーベース", "アンビエント"]
    },
    {
        "name": "ジャズ",
        "subgenres": ["スウィング", "ビバップ", "クールジャズ", "フュージョン", "スムースジャズ", "アヴァンギャルドジャズ"]
    },
    {
        "name": "クラシック",
        "subgenres": ["バロック", "ロマン派", "現代音楽", "室内楽", "交響曲"]
    },
    {
        "name": "ヒップホップ / ラップ",
        "subgenres": ["オールドスクール", "トラップ", "ブーンバップ", "ローファイヒップホップ", "オルタナティヴヒップホップ", "ジャズラップ"]
    },
    {
        "name": "メタル",
        "subgenres": ["ヘヴィメタル", "スラッシュメタル", "ブラックメタル", "デスメタル", "メタルコア", "プログレッシブメタル"]
    },
    {
        "name": "フォーク / カントリー",
        "subgenres": ["アメリカーナ", "ブルーグラス", "カントリーロック", "ニューフォーク", "トラディショナル"]
    },
    {
        "name": "R&B / ソウル",
        "subgenres": ["クラシックソウル", "コンテンポラ���ーR&B", "ニューソウル", "モータウン", "ファンク"]
    },
    {
        "name": "ダンス / ディスコ",
        "subgenres": ["ディスコミュージック", "ユーロビート", "ハイエナジー", "フレンチハウス"]
    },
    {
        "name": "ワールドミュージック",
        "subgenres": ["レゲエ", "スカ", "ラテン", "アフロビート", "ボサノヴァ", "Klezmer", "タランテラ", "演歌"]
    },
    {
        "name": "サウンドトラック / 実験系",
        "subgenres": ["映画音楽", "ゲーム音楽", "ローファイ", "エクスペリメンタル", "ミニマル"]
    }
];

const allSubgenres = genreData.flatMap(g => g.subgenres);

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
  const [hasLyrics, setHasLyrics] = useState(false);
  const [lyricsContent, setLyricsContent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [otherGenre, setOtherGenre] = useState('');
  const [openGenre, setOpenGenre] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [instrumentError, setInstrumentError] = useState('');

  useEffect(() => {
    if (order) {
      setTheme(order.theme || '');
      setInstruments(order.instruments?.join(', ') || '');
      setHasLyrics(order.has_lyrics || false);
      setLyricsContent(order.lyrics_content || '');
      setAdditionalNotes(order.additional_notes || '');

      // ジャンルの初期値を設定
      const predefinedGenres = order.genres?.filter(g => allSubgenres.includes(g)) || [];
      const other = order.genres?.find(g => !allSubgenres.includes(g)) || '';
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
    setInstrumentError('');

    const finalGenres = [...selectedGenres];
    if (otherGenre.trim() !== '') {
      finalGenres.push(otherGenre.trim());
    }

    if (finalGenres.length === 0) {
      setMessage('ジャンルを1つ以上選択してください。');
      return;
    }
    
    if (instruments.includes('、')) {
      setInstrumentError('使用楽器は半角カンマ「,」で区切って入力してください。');
      return;
    }

    setLoading(true);
    setMessage('');

    const updatedData = {
      theme,
      instruments: instruments.split(',').map(item => item.trim()).filter(item => item),
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
          </div>
          {message && <p className={`text-center ${message.includes('エラー') ? 'text-red-500' : 'text-blue-500'}`}>{message}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="theme-edit" className="text-sm font-medium text-gray-700">
                テーマ / コンセプト<span className="text-red-500">*</span>
              </label>
              <input
                id="theme-edit"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">
                ジャンル / スタイル (3つまで選択)<span className="text-red-500">*</span>
              </label>
              <div className="p-2 mt-1 border border-gray-200 rounded-md">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedGenres.map(genre => (
                    <div key={genre} className="flex items-center px-2 py-1 text-sm text-white bg-indigo-600 rounded-full">
                      <span>{genre}</span>
                      <button type="button" onClick={() => handleGenreChange(genre)} className="ml-2 text-white hover:text-gray-200">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {genreData.map(genre => (
                    <div key={genre.name}>
                      <button
                        type="button"
                        onClick={() => setOpenGenre(openGenre === genre.name ? null : genre.name)}
                        className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-800 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                      >
                        <span>{genre.name}</span>
                        <svg
                          className={`w-5 h-5 transform transition-transform ${openGenre === genre.name ? 'rotate-180' : ''}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openGenre === genre.name ? 'max-h-96' : 'max-h-0'}`}
                      >
                        <div className="grid grid-cols-2 gap-2 p-4 bg-white border border-t-0 border-gray-200 rounded-b-md">
                          {genre.subgenres.map(subgenre => (
                            <button
                              type="button"
                              key={subgenre}
                              onClick={() => handleGenreChange(subgenre)}
                              disabled={selectedGenres.length >= 3 && !selectedGenres.includes(subgenre)}
                              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                selectedGenres.includes(subgenre)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50'
                              }`}
                            >
                              {subgenre}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <label htmlFor="otherGenre-edit" className="text-sm font-medium text-gray-700">
                  その他 (自由入力)
                </label>
                <input
                  id="otherGenre-edit"
                  type="text"
                  value={otherGenre}
                  onChange={(e) => setOtherGenre(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="選択肢にないジャンルを入力"
                  disabled={selectedGenres.length >= 3 && !selectedGenres.includes(otherGenre)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <label htmlFor="instruments-edit" className="text-sm font-medium text-gray-700">
                  使用楽器
                </label>
                <div className="relative ml-2 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    複数の楽器はカンマ（,）で区切って入力してください
                  </span>
                </div>
              </div>
              <input
                id="instruments-edit"
                type="text"
                value={instruments}
                onChange={(e) => {
                  setInstruments(e.target.value);
                  if (instrumentError) setInstrumentError('');
                }}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 text-gray-900 ${instrumentError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'}`}
                placeholder="例：ピアノ, ヴァイオリン, ドラム"
              />
              {instrumentError ? (
                <p className="mt-1 text-xs text-red-500">{instrumentError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  カンマ区切りで入力してください。例: ピアノ, ヴァイオリン, ドラム
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input id="hasLyrics-edit" type="checkbox" checked={hasLyrics} onChange={(e) => setHasLyrics(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="hasLyrics-edit" className="ml-2 block text-sm text-gray-900">
                歌詞あり
              </label>
            </div>

            {hasLyrics && (
              <div>
                <label htmlFor="lyricsContent-edit" className="text-sm font-medium text-gray-700">
                  歌詞の内容
                </label>
                <textarea
                  id="lyricsContent-edit"
                  value={lyricsContent}
                  onChange={(e) => setLyricsContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="additionalNotes-edit" className="text-sm font-medium text-gray-700">
                その他の要望
              </label>
              <textarea
                id="additionalNotes-edit"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
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