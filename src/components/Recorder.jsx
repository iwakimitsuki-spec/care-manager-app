import { useState } from 'react';
import { Mic, Square, Trash2, StopCircle, Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { reconstructTranscriptWithAI, analyzeAudioWithAI } from '../utils/gemini';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export const Recorder = ({ isRecording, toggleRecording, transcript, setTranscript, resetTranscript }) => {
    const [recordMode, setRecordMode] = useState('text'); // 'text' or 'audio'
    const [isReconstructing, setIsReconstructing] = useState(false);
    const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
    const [error, setError] = useState('');
    const [audioApiError, setAudioApiError] = useState('');

    const { isAudioRecording, startAudioRecording, stopAudioRecording, audioBlob, resetAudio } = useAudioRecorder();

    const handleReconstruct = async () => {
        setError('');
        setIsReconstructing(true);
        try {
            const reconstructed = await reconstructTranscriptWithAI(transcript);
            setTranscript(reconstructed);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsReconstructing(false);
        }
    };

    const handleAnalyzeAudio = async () => {
        setAudioApiError('');
        setIsAnalyzingAudio(true);
        try {
            const aiText = await analyzeAudioWithAI(audioBlob);
            setTranscript(`=== 🎙️ 高精度AI解析結果（録音データより） ===\n\n${aiText}\n\n-----------------------------\n=== リアルタイム文字起こし履歴 ===\n${transcript}`);
        } catch (err) {
            setAudioApiError(err.message);
        } finally {
            setIsAnalyzingAudio(false);
        }
    };

    const handleToggleRecording = () => {
        if (recordMode === 'text') {
            toggleRecording();
        } else {
            if (isAudioRecording) stopAudioRecording();
            else startAudioRecording();
        }
    };

    return (
        <div className="card">
            <div className="header mb-4">
                <h2 className="header-title">録音モード選択</h2>
                <p className="header-subtitle">用途に合わせてモードを切り替えてください</p>
            </div>

            <div className="tabs mb-4">
                <button
                    className={`tab ${recordMode === 'text' ? 'active' : ''}`}
                    onClick={() => setRecordMode('text')}
                    disabled={isRecording || isAudioRecording}
                >
                    📝 リアルタイム文字起こし
                </button>
                <button
                    className={`tab ${recordMode === 'audio' ? 'active' : ''}`}
                    onClick={() => setRecordMode('audio')}
                    disabled={isRecording || isAudioRecording}
                >
                    🎙️ AI高精度録音（話者分離・要約）
                </button>
            </div>

            <div className="flex-between mb-4">
                <button
                    className={`btn ${isRecording || isAudioRecording ? 'btn-danger' : 'btn-primary'}`}
                    onClick={handleToggleRecording}
                    style={{ width: '100%', fontSize: '1.05rem', padding: '0.8rem' }}
                >
                    {isRecording || isAudioRecording ? (
                        <>
                            <StopCircle size={22} />
                            録音を停止
                        </>
                    ) : (
                        <>
                            <Mic size={22} />
                            録音を開始
                        </>
                    )}
                </button>
            </div>

            {/* 録音中インジケーター */}
            {(isRecording || isAudioRecording) && (
                <div className="recording-indicator" style={{ marginBottom: '1rem' }}>
                    <div className="dot"></div>
                    {recordMode === 'text' ? 'リアルタイム文字起こし中...' : '高音質データ録音中... (文字は表示されませんが録音されています)'}
                </div>
            )}

            {/* Error Displays */}
            {error && recordMode === 'text' && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{error}</span>
                </div>
            )}
            {audioApiError && recordMode === 'audio' && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{audioApiError}</span>
                </div>
            )}

            {/* Content Area Based on Mode */}
            {recordMode === 'text' ? (
                <>
                    <div className="transcript-box" style={{ marginBottom: '1.5rem' }}>
                        {transcript ? (
                            <p style={{ whiteSpace: 'pre-wrap' }}>{transcript}</p>
                        ) : (
                            <div className="transcript-placeholder">
                                録音を開始すると、ここにテキストが表示されます
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleReconstruct}
                            disabled={!transcript || isReconstructing || isRecording}
                            title="AIが文脈から話者を推測し、台本形式に整理します"
                            style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white', flex: 1 }}
                        >
                            {isReconstructing ? <Loader2 size={16} className="spin" /> : <Users size={16} />}
                            {isReconstructing ? '話者を分離中...' : 'テキストの文脈から話者分離 (AI)'}
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={resetTranscript}
                            disabled={!transcript}
                        >
                            <Trash2 size={16} />
                            クリア
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Audio Mode Content */}
                    <div className="transcript-box" style={{ marginBottom: '1.5rem', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem' }}>
                        {audioBlob ? (
                            <>
                                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--success)' }}>✅ 録音完了</p>
                                <audio
                                    controls
                                    src={URL.createObjectURL(audioBlob)}
                                    style={{ width: '100%', maxWidth: '400px', height: '40px', outline: 'none' }}
                                />
                                <a
                                    href={URL.createObjectURL(audioBlob)}
                                    download="care-reporter-audio.webm"
                                    style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline' }}
                                >
                                    録音データ (音声ファイル) をダウンロード
                                </a>
                            </>
                        ) : (
                            <span style={{ color: 'var(--text-muted)' }}>録音を開始してください。音声は直接AIに送られるため、非常に高い精度で話者分離・議事録作成が行われます。</span>
                        )}
                    </div>

                    {audioBlob && (
                        <button
                            className="btn"
                            onClick={handleAnalyzeAudio}
                            disabled={isAnalyzingAudio || isAudioRecording}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white', width: '100%', padding: '0.8rem' }}
                        >
                            {isAnalyzingAudio ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                            {isAnalyzingAudio ? '音声をAIが聞き取り中 (約10〜30秒)...' : '✨ 録音データから「超高精度な議事録・話者分離」を作成'}
                        </button>
                    )}

                    <button
                        className="btn btn-outline"
                        onClick={resetAudio}
                        disabled={!audioBlob}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        <Trash2 size={16} />
                        録音データを破棄
                    </button>
                </div>
            )}
        </div>
    );
};
