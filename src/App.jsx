import { useState } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { Recorder } from './components/Recorder';
import { MinuteEditor } from './components/MinuteEditor';
import { SettingsModal } from './components/SettingsModal';
import { ClipboardEdit, AlertCircle, Settings } from 'lucide-react';
import './index.css';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    isRecording,
    transcript,
    setTranscript,
    toggleRecording,
    resetTranscript,
    isSupported,
    error
  } = useSpeechRecognition();

  if (!isSupported) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '400px' }}>
          <AlertCircle size={48} color="var(--destructive)" style={{ marginBottom: '1rem' }} />
          <h3>非対応ブラウザです</h3>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            お使いのブラウザは音声認識機能（Web Speech API）をサポートしていません。<br />
            Google Chrome や Microsoft Edge などの対応ブラウザをご利用ください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        marginBottom: '2rem'
      }}>
        <div className="container" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', color: 'white' }}>
              <ClipboardEdit size={24} />
            </div>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Care Reporter</h1>
          </div>
          <button
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            title="設定"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
        {error && (
          <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--destructive)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--destructive)' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Recorder
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            transcript={transcript}
            setTranscript={setTranscript}
            resetTranscript={resetTranscript}
          />

          <MinuteEditor
            transcript={transcript}
          />
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default App;
