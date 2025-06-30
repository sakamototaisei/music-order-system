
"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import EditOrderModal from './EditOrderModal'; // Import the modal component

// Propsの型定義
interface OrderHistoryProps {
  user: User;
  refreshCounter: number;
  onOrderMutated: () => void;
}

// Orderの型定義
interface Order {
  id: string;
  theme: string;
  status: string;
  created_at: string;
  instruments: string[];
  genres: string[];
  has_lyrics: boolean;
  lyrics_content: string;
  additional_notes: string;
}

// 各オーダー項目コンポーネント
const AccordionItem = ({ order, onOrderMutated }: { order: Order, onOrderMutated: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State to control the edit modal
  const [isCopied, setIsCopied] = useState(false); // State for copy feedback

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy ID: ', err);
      alert('IDのコピーに失敗しました。');
    });
  };

  const handleDelete = async () => {
    if (window.confirm('本当にこのオーダーを削除しますか？この操作は取り消せません。')) {
      setIsDeleting(true);
      const { error } = await supabase
        .from('music_orders')
        .delete()
        .eq('id', order.id);

      if (error) {
        alert(`削除中にエラーが発生しました: ${error.message}`);
      } else {
        alert('オーダーを削除しました。');
        onOrderMutated();
      }
      setIsDeleting(false);
    }
  };

  return (
    <>
      <li className="border border-gray-200 rounded-md">
        <div className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100">
          <div className="flex justify-between items-center">
            <div onClick={() => setIsOpen(!isOpen)} className="flex-grow cursor-pointer">
              <p className="font-semibold text-gray-900">{order.theme}</p>
              <div className="flex items-center mt-1">
                <p className="text-xs text-gray-500">オーダーID: {order.id}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion from toggling
                    handleCopy(order.id);
                  }}
                  className="ml-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  {isCopied ? 'コピー完了' : 'コピー'}
                </button>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-medium px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                {order.status}
              </p>
              <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString('ja-JP')}</p>
            </div>
          </div>
        </div>
        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>ジャンル:</strong> {order.genres?.join(', ') || '指定なし'}</p>
              <p><strong>使用楽器:</strong> {order.instruments?.join(', ') || '指定なし'}</p>
              <p><strong>歌詞:</strong> {order.has_lyrics ? 'あり' : 'なし'}</p>
              {order.additional_notes && (
                <div>
                  <strong>その他の要望:</strong>
                  <p className="whitespace-pre-wrap p-2 bg-gray-50 rounded mt-1">{order.additional_notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setIsEditing(true)} // Open the edit modal
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        )}
      </li>
      {isEditing && (
        <EditOrderModal
          order={order}
          onClose={() => setIsEditing(false)}
          onOrderUpdated={() => {
            onOrderMutated();
            setIsEditing(false);
          }}
        />
      )}
    </>
  );
};

// オーダー履歴のメインコンポーネント
export default function OrderHistory({ user, refreshCounter, onOrderMutated }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('music_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [user.id]);

  // Initial fetch and visibility change handler
  useEffect(() => {
    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders]);

  // Refetch when refreshCounter changes
  useEffect(() => {
    if (refreshCounter > 0) {
      fetchOrders();
    }
  }, [refreshCounter, fetchOrders]);

  if (loading) {
    return <p>オーダー履歴を読み込み中...</p>;
  }

  if (error) {
    return <p className="text-red-500">エラー: {error}</p>;
  }

  return (
    <div className="w-full max-w-4xl p-8 mt-8 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900">あなたのオーダー履歴</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-gray-500">まだオーダーがありません。</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <AccordionItem key={order.id} order={order} onOrderMutated={onOrderMutated} />
          ))}
        </ul>
      )}
    </div>
  );
}
