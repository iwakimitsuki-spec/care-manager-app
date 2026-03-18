import { useState } from 'react';
import { Mic, Square, Trash2, StopCircle, Users, Loader2, AlertCircle } from 'lucide-react';
import { reconstructTranscriptWithAI } from '../utils/gemini';

export const Recorder = ({ isRecording, toggleRecording, transcript, setTranscript, resetTranscript }) => {
    const [isReconstructing, setIsReconstructing] = useState(false);
    const [error, setError] = useState('');

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

    return (
        <div className="card">
            <div className="header mb-4">
                <h2 className="header-title">録音・文字起こし</h2>
                <p className="header-subtitle">会話をリアルタイムでテキスト化します</p>
            </div>

            <div className="flex-between mb-4">
                <button
                    className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggleRecording}
                    style={{ width: '100%' }}
                >
                    {isRecording ? (
                        <>
                            <StopCircle size={20} />
                            録音を停止
                        </>
                    ) : (
                        <>
                            <Mic size={20} />
                            録音を開始
                        </>
                    )}
                </button>
            </div>

            {isRecording && (
                <div className="recording-indicator">
                    <div className="dot"></div>
                    録音中...
                </div>
            )}

            <div className="transcript-box">
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-secondary"
                    onClick={handleReconstruct}
                    disabled={!transcript || isReconstructing || isRecording}
                    title="AIが文脈から話者を推測し、台本形式に整理します"
                    style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white' }}
                >
                    {isReconstructing ? <Loader2 size={16} className="spin" /> : <Users size={16} />}
                    {isReconstructing ? '話者を分離中...' : '会話を話者ごとに分離 (AI)'}
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
        </div>
    );
};
