import { useState, useEffect } from 'react';
import { X, Save, Key, ShieldAlert } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setGeminiKey(localStorage.getItem('gemini_api_key') || '');
            setIsSaved(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', geminiKey);
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex-between mb-4">
                    <h2 className="header-title" style={{ fontSize: '1.25rem' }}>
                        <Key size={20} />
                        API設定
                    </h2>
                    <button className="btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <ShieldAlert size={16} />
                    <span>
                        入力されたAPIキーはすべてご使用のブラウザのローカルストレージにのみ保存され、外部サーバーには送信されません。（各APIサービスへのリクエスト時のみ使用されます）
                    </span>
                </div>

                <div className="form-group">
                    <label className="form-label">Gemini API キー (必須)</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        AIによる議事録の自動作成および、会話文脈からの「話者推測（誰が話したか）」に使用します。
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '2rem' }}>
                    <button className="btn btn-outline" onClick={onClose}>
                        キャンセル
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={18} />
                        {isSaved ? '保存しました' : '設定を保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};
