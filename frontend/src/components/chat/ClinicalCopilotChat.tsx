import React,{ useState,useEffect,useRef } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import { X,Send,Sparkles,Key,Check,Loader2,Stethoscope } from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import type { ChatMessageItem } from '../../types';

interface PatientContext {
  disease?: string;
  risk_percentage?: number;
  risk_level?: string;
  consensus_agreement?: string;
  disagreement_spread?: number;
  features?: Record<string, number>;
  top_drivers?: any[];
}

const DEFAULT_SUGGESTIONS = [
  "Explain this patient's disease risk score",
  "Why does ICMR advise BMI ≥ 23 for South Asians?",
  "How does the 6-qubit VQC achieve 99.88% compression?",
  "Why does the platform abstain on Glucose = 0?"
];

export const ClinicalCopilotChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'model',
      text: "### 👋 Hello! I'm Dr. Quanta\nYour **Clinical Decision Support Copilot & SIH Technical Advisor**.\n\nFeel free to ask me anything about patient risk scores, ICMR-INDIAB & ADA clinical guidelines, or how our 6-qubit Variational Quantum Circuit operates.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'built-in-clinical-intelligence'
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [keySaved, setKeySaved] = useState<boolean>(false);
  const [followups, setFollowups] = useState<string[]>(DEFAULT_SUGGESTIONS);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved API key and latest prediction context
  useEffect(() => {
    const savedKey = localStorage.getItem('qhai_gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedPred = localStorage.getItem('qhai_last_prediction');
    if (savedPred) {
      try {
        const parsed = JSON.parse(savedPred);
        const hybridRiskPct = parsed.hybrid_result?.risk_percentage 
          ?? (parsed.hybrid_result?.risk_probability !== undefined ? Math.round(parsed.hybrid_result.risk_probability * 100) : undefined)
          ?? parsed.risk_percentage 
          ?? (parsed.risk_probability !== undefined ? Math.round(parsed.risk_probability * 100) : 0);

        setPatientContext({
          disease: parsed.disease,
          risk_percentage: hybridRiskPct,
          risk_level: parsed.hybrid_result?.risk_level || parsed.risk_level,
          consensus_agreement: parsed.consensus?.agreement,
          disagreement_spread: parsed.disagreement_range?.spread,
          features: parsed.features_dict || parsed.input_features,
          top_drivers: parsed.key_drivers || parsed.top_drivers,
        });
      } catch {
        // ignore parse error
      }
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('qhai_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('qhai_gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyConfig(false);
    }, 1200);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessageItem = {
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: textToSend.trim(),
        history: messages,
        patient_context: patientContext,
        api_key: apiKey.trim() || undefined,
      });

      const botMsg: ChatMessageItem = {
        role: 'model',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (response.suggested_followups && response.suggested_followups.length > 0) {
        setFollowups(response.suggested_followups);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ *Communication Error*: Unable to reach clinical copilot service. (${err?.message || 'Check server connection'})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown text renderer for headers, bold, bullets, and alerts
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Header 3 (###)
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-white text-sm mt-3 mb-1.5 flex items-center gap-1.5 text-indigo-300">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-gray-300 text-xs my-0.5 leading-relaxed">
            <span dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono text-indigo-300">$1</code>')
            }} />
          </li>
        );
      }

      // Numbered items (1. 2.)
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="ml-2 text-gray-300 text-xs my-1 flex items-start gap-1.5 leading-relaxed">
            <span className="font-mono text-indigo-400 font-bold shrink-0">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span dangerouslySetInnerHTML={{
              __html: trimmed.replace(/^\d+\.\s/, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono text-indigo-300">$1</code>')
            }} />
          </div>
        );
      }

      // Blockquote / Alerts (> )
      if (trimmed.startsWith('> ')) {
        return (
          <div key={idx} className="p-2.5 my-2 rounded-xl bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-200 text-xs italic">
            {trimmed.replace('> ', '').replace(/\*(.*?)\*/g, '$1')}
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-gray-300 text-xs my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{
            __html: trimmed
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono text-indigo-300">$1</code>')
          }} />
        </p>
      );
    });
  };

  return (
    <div className={`fixed right-4 sm:right-6 z-40 select-none ${isOpen ? 'bottom-4 sm:bottom-6' : 'bottom-24 sm:bottom-20'}`}>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg border border-teal-500/30 transition-all group"
          >
            <div className="relative">
              <Sparkles size={18} className="text-teal-200" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold leading-none flex items-center gap-1">
                Dr. Quanta AI <span className="text-[10px] bg-teal-700/60 px-1 rounded font-mono font-normal">Gemini</span>
              </div>
              <div className="text-[10px] text-teal-100/80 leading-tight">Clinical & Quantum Copilot</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden text-sm"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Stethoscope size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-slate-100">Dr. Quanta</h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      Gemini Copilot
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Decision Support • ICMR & VQC
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  title="Configure Gemini API Key"
                  className={`p-1.5 rounded-lg transition-colors ${showKeyConfig ? 'bg-teal-600 text-white' : 'hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  <Key size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* API Key Configuration Dropdown */}
            {showKeyConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-slate-950/90 border-b border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Key size={13} className="text-teal-400" /> Custom Gemini API Key
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Optional Override</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy... (leave blank for backend key)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    {keySaved ? <Check size={14} /> : 'Save'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  Key is saved locally in your browser. If unset, uses backend `.env` or offline medical intelligence.
                </div>
              </motion.div>
            )}

            {/* Active Case Banner */}
            {patientContext && (
              <div className="px-4 py-2 bg-teal-950/20 border-b border-slate-800 text-[11px] text-slate-300 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                  Case Context: <strong className="text-slate-100 capitalize">{patientContext.disease || 'Diabetes'}</strong> ({patientContext.risk_percentage}% Risk)
                </span>
                <span className="text-[10px] text-teal-400 shrink-0 uppercase font-semibold">
                  Synced
                </span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 ${
                        isUser
                          ? 'bg-teal-600 text-white shadow-sm rounded-br-none font-medium'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        renderFormattedText(msg.text)
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 px-1 flex items-center gap-1.5">
                      {msg.timestamp}
                      {msg.source === 'gemini-2.5-flash' && (
                        <span className="text-teal-400 font-semibold">via Gemini 2.5 Flash</span>
                      )}
                    </span>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 w-fit text-xs text-teal-300">
                  <Loader2 size={15} className="animate-spin text-teal-400" />
                  <span className="font-mono">Dr. Quanta is reasoning over clinical guidelines & quantum state...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Follow-up Chips */}
            {followups.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">Quick:</span>
                {followups.slice(0, 3).map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(f)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap transition-colors font-mono hover:text-slate-100 shrink-0"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Dr. Quanta a clinical or quantum question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2 rounded-xl transition-colors ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-sm'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
