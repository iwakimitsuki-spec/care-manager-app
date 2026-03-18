import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
    const [isAudioRecording, setIsAudioRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 多くのブラウザでサポートされている webm 形式を使用
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);

                // カメラ・マイクのストリームを確実に停止し、ブラウザの「録音中アイコン」を消す
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsAudioRecording(true);
            setAudioBlob(null);
        } catch (error) {
            console.error('マイクのアクセスエラー (MediaRecorder):', error);
            alert('マイクへのアクセスが許可されていません。設定をご確認ください。');
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsAudioRecording(false);
        }
    };

    const resetAudio = () => {
        setAudioBlob(null);
    };

    return {
        isAudioRecording,
        startAudioRecording,
        stopAudioRecording,
        audioBlob,
        resetAudio
    };
};
