import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);
    const pastTranscriptRef = useRef('');
    const sessionFinalRef = useRef('');

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            setError('お使いのブラウザは音声認識をサポートしていません。ChromeやEdgeなどをご利用ください。');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        // Android Chromeの深刻な重複バグへの対応策: 
        // Androidの場合は暫定結果(interim)を切ることで二重発火を完全に防止する
        const isAndroid = /Android/i.test(navigator.userAgent);

        recognition.continuous = true;
        recognition.interimResults = !isAndroid; // Androidだけfalseにする
        recognition.lang = 'ja-JP';

        recognition.onresult = (event) => {
            let currentFinal = '';
            let currentInterim = '';

            // 常に 0 からループすることで、Android特有の重複バグや resultIndex の不整合を完全に防ぐ
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    currentFinal += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }

            // 現在のセッションの確定分を保持しておく（onendで履歴に移動するため）
            sessionFinalRef.current = currentFinal;

            // 全体テキスト ＝ 過去のセッションの履歴 ＋ 現在のセッションの確定分 ＋ リアルタイ厶中（推測中）の分
            setTranscript(pastTranscriptRef.current + currentFinal + currentInterim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('マイクへのアクセスが許可されていません。設定をご確認ください。');
            }
            // Ignore no-speech errors to stop them from crashing the UI
        };

        recognition.onend = () => {
            // セッションが切れたら、今のセッションの確定テキストを過去の履歴としてセーブし、リセットする
            if (sessionFinalRef.current) {
                pastTranscriptRef.current += sessionFinalRef.current;
                sessionFinalRef.current = '';
            }

            // isRecordingの状態を最新のDOMから知る術がないので、一旦終了するだけにして
            // 親コンポーネント側で再スタートするかどうかを判定する設計が良いが、
            // 簡易的にリファレンスを使って実装するなら isRecording 状態をrefに入れる必要がある。
            // 今回はuseEffect(..., [isRecording])で制御するので自動リスタートはそちらに任せる or 省略する。
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []); // isRecording is captured via state, but we manually start/stop it

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isRecording) {
            setError('');
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Recognition already started or failed to start", e);
            }
        } else {
            recognitionRef.current.stop();
        }

        // 状態監視用に isRecording が変わるたびに onend を再定義してクロージャ内の isRecording を最新にする
        recognitionRef.current.onend = () => {
            if (sessionFinalRef.current) {
                pastTranscriptRef.current += sessionFinalRef.current;
                sessionFinalRef.current = '';
            }
            if (isRecording) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // ignore
                }
            }
        };
    }, [isRecording]);

    const toggleRecording = () => {
        if (!isSupported) return;
        setIsRecording(prev => !prev);
    };

    const resetTranscript = () => {
        setTranscript('');
        pastTranscriptRef.current = '';
        sessionFinalRef.current = '';
    };

    return {
        isRecording,
        transcript,
        setTranscript, // expose for manual editing if needed
        toggleRecording,
        resetTranscript,
        isSupported,
        error,
    };
};
