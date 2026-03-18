import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            setError('お使いのブラウザは音声認識をサポートしていません。ChromeやEdgeなどをご利用ください。');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        // Configure recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ja-JP';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('マイクへのアクセスが許可されていません。設定をご確認ください。');
            } else {
                setError(`音声認識エラー: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            // Auto-restart if we were supposed to be recording
            if (isRecording) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Could not auto-restart recognition", e);
                    setIsRecording(false);
                }
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []); // isRecording is captured via state, but we manually start/stop it

    // Need a separate effect to handle manual start/stop to avoid re-binding events
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
    }, [isRecording]);

    const toggleRecording = () => {
        if (!isSupported) return;
        setIsRecording(prev => !prev);
    };

    const resetTranscript = () => {
        setTranscript('');
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
