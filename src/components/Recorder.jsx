import { useState } from 'react';
import { Mic, Square, Trash2, StopCircle, Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { reconstructTranscriptWithAI, analyzeAudioWithAI } from '../utils/gemini';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export const Recorder = ({ isRecording, toggleRecording, transcript, setTranscript, resetTranscript }) => {
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
        if (isRecording || isAudioRecording) {
            if (isRecording) toggleRecording();
            if (isAudioRecording) stopAudioRecording();
        } else {
            toggleRecording();
            startAudioRecording();
        }
    };

    return (
        <div className="card">
            <div className="header mb-4">
                <h2 className="header-title">録音・文字起こし</h2>
                <p className="header-subtitle">会話をリアルタイムでテキスト化します</p>
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

            {isRecording && (
                <div className="recording-indicator">
                    <div className="dot"></div>
                    録音中...（文字起こし & 高音質バックアップ）
                </div>
            )}

            <div className="transcript-box" style={{ marginBottom: '1.5rem' }}>
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
                    </div>
                )}
                {audioApiError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{audioApiError}</span>
                    </div>
                )}
                {transcript ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{transcript}</p>
                ) : (
                    <div className="transcript-placeholder">
                        録音を開始すると、ここにテキストが表示されます
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 録音データがある場合のみ表示される高精度解析ボタン */}
                {audioBlob && (
                    <button
                        className="btn"
                        onClick={handleAnalyzeAudio}
                        disabled={isAnalyzingAudio || isRecording || isAudioRecording}
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white', width: '100%', padding: '0.8rem' }}
                    >
                        {isAnalyzingAudio ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                        {isAnalyzingAudio ? '音声をAIが聞き取り中 (約10〜30秒)...' : '✨ 完了した録音データから「超高精度な議事録・話者分離」を作成'}
                    </button>
                )}

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
                        onClick={() => { resetTranscript(); resetAudio(); }}
                        disabled={!transcript && !audioBlob}
                    >
                        <Trash2 size={16} />
                        クリア
                    </button>
                </div>
            </div>
        </div>
    );
};
