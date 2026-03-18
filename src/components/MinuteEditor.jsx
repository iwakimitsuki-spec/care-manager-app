import { useState, useEffect } from 'react';
import { generateMinute } from '../utils/minuteGenerator';
import { generateMinuteWithAI } from '../utils/gemini';
import { Download, FileText, CheckCircle2, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export const MinuteEditor = ({ transcript }) => {
    const [minuteType, setMinuteType] = useState('monitoring');
    const [minuteContent, setMinuteContent] = useState('');
    const [copied, setCopied] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiError, setAiError] = useState('');

    // Auto-generate minute template when type changes or transcript explicitly requested
    const handleGenerate = () => {
        setMinuteContent(generateMinute(minuteType, transcript));
    };

    const handleAIGenerate = async () => {
        setAiError('');
        setIsGeneratingAI(true);
        try {
            const result = await generateMinuteWithAI(transcript, minuteType);
            setMinuteContent(result);
        } catch (err) {
            setAiError(err.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // Automatically update minute when switching tabs
    useEffect(() => {
        handleGenerate();
    }, [minuteType]);

    const handleDownload = async () => {
        try {
            const date = new Date();
            const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            const defaultFilename = `${minuteType === 'monitoring' ? 'モニタリング' : '担当者会議'}_${formattedDate}.txt`;

            // BOM（バイト順マーク）を先頭に付与することで、Windowsのメモ帳等での文字化けを防ぐ
            const blob = new Blob(['\uFEFF', minuteContent], { type: 'text/plain;charset=utf-8' });

            // File System Access APIが使えるブラウザ（PC版Chrome/Edgeなど）の場合
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: defaultFilename,
                    types: [{
                        description: 'テキストファイル',
                        accept: { 'text/plain': ['.txt'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // 未対応ブラウザ（スマホ等）のフォールバック処理
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = defaultFilename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (error) {
            // ユーザーが保存ダイアログをキャンセルした場合はエラーを無視
            if (error.name !== 'AbortError') {
                console.error('Download failed:', error);
                alert('ファイルの保存に失敗しました。');
            }
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(minuteContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="card">
            <div className="header mb-4">
                <h2 className="header-title">議事録エディタ</h2>
                <p className="header-subtitle">文字起こしから議事録を作成します</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${minuteType === 'monitoring' ? 'active' : ''}`}
                    onClick={() => setMinuteType('monitoring')}
                >
                    モニタリング訪問
                </button>
                <button
                    className={`tab ${minuteType === 'conference' ? 'active' : ''}`}
                    onClick={() => setMinuteType('conference')}
                >
                    担当者会議
                </button>
            </div>

            <div className="form-group mb-4">
                <div className="flex-between mb-4">
                    <label className="form-label" style={{ marginBottom: 0 }}>
                        {minuteType === 'monitoring' ? 'モニタリング訪問記録' : '担当者会議 議事録'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleGenerate}
                            disabled={!transcript || isGeneratingAI}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                        >
                            <FileText size={16} /> 本文に反映
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleAIGenerate}
                            disabled={!transcript || isGeneratingAI}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                            title="OpenAI APIを使用して文字起こしから内容を自動で要約・抽出します"
                        >
                            {isGeneratingAI ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                            {isGeneratingAI ? 'AIが作成中...' : 'AIで自動作成'}
                        </button>
                    </div>
                </div>
                {aiError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{aiError}</span>
                    </div>
                )}
                <textarea
                    className="form-textarea"
                    value={minuteContent}
                    onChange={(e) => setMinuteContent(e.target.value)}
                    style={{ minHeight: '300px' }}
                    placeholder="テンプレートを選択して入力してください..."
                />
            </div>

            <div className="flex-gap mt-4" style={{ justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-outline"
                    onClick={handleCopy}
                    disabled={!minuteContent}
                >
                    {copied ? <CheckCircle2 size={18} color="var(--secondary)" /> : <FileText size={18} />}
                    {copied ? 'コピーしました' : 'クリップボードにコピー'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleDownload}
                    disabled={!minuteContent}
                >
                    <Download size={18} />
                    テキストとして保存
                </button>
            </div>
        </div>
    );
};
