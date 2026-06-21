import { Bot, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your TrendWatch AI assistant. Ask me about news, trends, or anything you\'d like to know.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  function speak(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/assistant/chat', {
        message: trimmed,
        history: messages.filter((m) => m.role === 'user' || m.role === 'assistant')
      });
      const reply = data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Sorry, I couldn\'t process that request. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleListening() {
    if (!SpeechRecognition) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Voice input is not supported in this browser. Please type your message instead.' }]);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.start();
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-white shadow-lg hover:scale-105 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400"
          aria-label="Open AI assistant"
        >
          <Bot size={26} />
        </button>
      )}

      {open && (
        <div className="animate-in fixed bottom-6 right-6 z-50 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-[#151b22]">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white dark:bg-cyan-500">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <p className="text-sm font-bold">TrendWatch AI</p>
                <p className="text-xs opacity-80">News & trends assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setVoiceEnabled((v) => !v); window.speechSynthesis.cancel(); }}
                className="rounded p-1.5 hover:bg-white/20"
                aria-label={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded p-1.5 hover:bg-white/20" aria-label="Close assistant">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-cyan-700 text-white dark:bg-cyan-500' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce [animation-delay:0.1s]">·</span>
                    <span className="animate-bounce [animation-delay:0.2s]">·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-lg p-2.5 transition ${listening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about news, trends..."
              className="focus-ring h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-cyan-700 p-2.5 text-white hover:bg-cyan-800 disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-400"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
