import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, X, Trash2, Copy, Check, Flame,
  Thermometer, Lightbulb, Compass, ChevronDown, RefreshCw, MessageSquare
} from 'lucide-react';
import { chatService, type ChatMessage, type ChatContext } from '../services/api';

interface ChatbotProps {
  currentDistrict?: string;
  activeTab?: string;
}

const QUICK_PROMPTS = [
  { label: '🔥 Hottest TN Districts', prompt: 'Which districts in Tamil Nadu have the highest thermal risk and surface temperatures?' },
  { label: '🌿 Cool Roof & Canopy Solutions', prompt: 'What are the most effective urban cooling strategies for high-density districts?' },
  { label: '📊 Explain LST, NDVI & NDBI', prompt: 'Explain Land Surface Temperature (LST), NDVI, and NDBI metrics.' },
  { label: '🚀 How to create a project?', prompt: 'How do I add a cooling project or submit community suggestions in Thermacity?' },
];

export const Chatbot: React.FC<ChatbotProps> = ({ currentDistrict, activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `### 🌡️ Welcome to Thermacity AI Copilot!

I am your urban heat intelligence assistant. I analyze land surface temperatures, heat risk indices, and green infrastructure across Tamil Nadu.

How can I help you optimize urban cooling today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: query.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const context: ChatContext = {
        district_name: currentDistrict,
        active_tab: activeTab,
      };

      const res = await chatService.sendMessage(updatedMessages, context);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error**: ${err.message || 'Unable to connect to Thermacity Assistant backend.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: `### 🌡️ Conversation cleared!

Ask me anything about Tamil Nadu thermal hotspots, satellite indices (LST, NDVI, NDBI), or urban cooling projects.`
      }
    ]);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to format simplified markdown into HTML elements
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-base font-bold text-orange-600 dark:text-orange-400 mt-2 mb-1">{parseInline(line.replace('### ', ''))}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-3 mb-1">{parseInline(line.replace('## ', ''))}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-3 mb-2">{parseInline(line.replace('# ', ''))}</h1>;
      }
      // Bullet list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemContent = line.trim().substring(2);
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-200 my-0.5 leading-relaxed">
            {parseInline(itemContent)}
          </li>
        );
      }
      // Numbered list items
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <li key={i} className="ml-4 list-decimal text-slate-700 dark:text-slate-200 my-0.5 leading-relaxed">
              {parseInline(match[2])}
            </li>
          );
        }
      }
      // Empty lines
      if (!line.trim()) {
        return <div key={i} className="h-1.5" />;
      }
      // Normal paragraph
      return <p key={i} className="text-slate-700 dark:text-slate-200 my-1 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  // Parse inline bold, inline code, highlight
  const parseInline = (text: string) => {
    // Replace **bold**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-mono border border-orange-200 dark:border-orange-800/40">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-white font-medium shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20 active:scale-95"
          title="Open Thermacity AI Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Sparkles className="w-5 h-5 animate-pulse text-amber-100" />
          <span className="text-sm font-semibold tracking-wide hidden sm:inline">Thermacity AI Copilot</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 font-bold backdrop-blur-sm">AI</span>
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] flex flex-col rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Flame className="w-5 h-5 text-amber-200 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide">Thermacity AI Copilot</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <p className="text-[11px] text-orange-100/90 font-medium">Tamil Nadu Urban Heat Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-1.5 rounded-lg hover:bg-white/20 text-orange-100 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Assistant"
                className="p-1.5 rounded-lg hover:bg-white/20 text-orange-100 hover:text-white transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Ribbon (if active district/tab) */}
          {(currentDistrict || activeTab) && (
            <div className="px-4 py-1.5 bg-orange-50 dark:bg-slate-800/80 border-b border-orange-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <Thermometer className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="font-medium truncate">
                  Context: <strong className="text-orange-600 dark:text-orange-400">{currentDistrict || 'All TN Districts'}</strong>
                  {activeTab && <span className="text-slate-400 font-normal"> ({activeTab})</span>}
                </span>
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5 border border-orange-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none font-medium'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div>
                      {renderMarkdown(msg.content)}
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Copy message"
                      >
                        {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/90 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 font-medium ml-1">Analyzing heat indices...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if chat is short) */}
          {messages.length <= 3 && !loading && (
            <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-1">Suggested Questions</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qp.prompt)}
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500 transition-all cursor-pointer shadow-xs"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Thermacity AI copilot..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-transparent dark:border-slate-700/50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer Disclaimer */}
          <div className="py-1 px-3 bg-slate-100/60 dark:bg-slate-950/60 text-center border-t border-slate-200/30 dark:border-slate-800/40">
            <span className="text-[10px] text-slate-400">Thermacity AI Copilot • Urban Thermal Decision Support</span>
          </div>

        </div>
      )}
    </div>
  );
};
