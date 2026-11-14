import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  Send,
} from 'lucide-react';
import { STARTER_QUESTIONS } from '../data/derivContent';
import { VoiceChatPanel } from './VoiceChatPanel';

export type ChatRole = 'guide' | 'strategist' | 'jargon';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  notice?: string;
}

interface AiGuideSectionProps {
  onOpenDemo: () => void;
  queuedPrompt?: { id: number; text: string; role?: ChatRole } | null;
  onConsultGuide?: () => void;
}

const ROLE_OPTIONS: Array<{ id: ChatRole; label: string; description: string }> = [
  {
    id: 'guide',
    label: 'Beginner Guide',
    description: 'Plain-English answers with Google Search market context',
  },
  {
    id: 'strategist',
    label: 'Investor vs. Trader',
    description: 'Compare long-term holding vs. short-term capped-risk trading',
  },
  {
    id: 'jargon',
    label: 'Fast Jargon Translator',
    description: 'Instant 2–3 sentence definitions of trading terms',
  },
];

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text: 'Ask anything about how Deriv works, whether long-term investing or short-term trading fits your routine, or today’s market news on Gold, Crypto, and Stocks. Every answer stays in plain English.',
};

export function AiGuideSection({
  onOpenDemo,
  queuedPrompt,
  onConsultGuide,
}: AiGuideSectionProps) {
  const [interactionMode, setInteractionMode] = useState<'text' | 'voice'>('text');
  const [role, setRole] = useState<ChatRole>('guide');
  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const lastProcessedPromptId = useRef<number | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (
    rawText: string,
    overrideRole?: ChatRole,
    overrideSearch?: boolean,
  ) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const activeRole = overrideRole ?? role;
    const activeSearch = overrideSearch ?? useSearch;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setErrorMsg(null);
    onConsultGuide?.();

    // Build clean multi-turn conversation history excluding the initial static greeting
    const conversationPayload = nextMessages
      .filter((m) => m.id !== INITIAL_ASSISTANT_MESSAGE.id)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      const response = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          role: activeRole,
          useSearch: activeSearch && activeRole !== 'jargon',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data?.fallbackAnswer === 'string' && data.fallbackAnswer.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: data.fallbackAnswer,
              notice: 'Answered from our verified plain-English guide while live AI is unavailable.',
            },
          ]);
        } else {
          setErrorMsg(data?.error || 'Could not reach the guide right now. Please try again.');
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: String(data.answer ?? ''),
          sources: Array.isArray(data.sources) ? data.sources : [],
          notice:
            data.source === 'fallback'
              ? 'Answered from our built-in plain-English guide.'
              : undefined,
        },
      ]);
    } catch {
      setErrorMsg('Connection interrupted. Please try sending your message again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!queuedPrompt || queuedPrompt.id === lastProcessedPromptId.current) return;
    lastProcessedPromptId.current = queuedPrompt.id;
    const targetRole = queuedPrompt.role ?? 'strategist';
    setInteractionMode('text');
    setRole(targetRole);
    setUseSearch(true);
    void sendMessage(queuedPrompt.text, targetRole, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedPrompt]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setErrorMsg(null);
  };

  const activeRoleMeta = ROLE_OPTIONS.find((r) => r.id === role) ?? ROLE_OPTIONS[0];

  return (
    <section id="ai-guide" className="py-16 sm:py-24 bg-[#FAF9F7] border-b border-[#181C25]/8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#181C25]/10 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Header & Role Controls */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#181C25]/10">
            <div className="max-w-xl">
              <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-1.5">
                Multi-Turn AI Guide · Live Google Search Grounding
              </p>
              <h2
                className="text-2xl sm:text-3xl font-display font-bold text-[#181C25] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Not Sure Where to Start? Chat with Deriv&apos;s Plain-English Guide
              </h2>
              <p className="mt-2 text-sm text-[#181C25]/70">{activeRoleMeta.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div
                role="group"
                aria-label="Choose chat or voice mode"
                className="flex items-center gap-1 p-1 bg-[#FAF9F7] border border-[#181C25]/10 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setInteractionMode('text')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    interactionMode === 'text'
                      ? 'bg-[#181C25] text-white'
                      : 'text-[#181C25]/70 hover:text-[#181C25]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>Text Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionMode('voice')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    interactionMode === 'voice'
                      ? 'bg-[#FF444F] text-white'
                      : 'text-[#181C25]/70 hover:text-[#181C25]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 shrink-0" />
                  <span>Live Voice</span>
                </button>
              </div>

              {interactionMode === 'text' && (
                <>
                  <button
                    type="button"
                    aria-pressed={useSearch}
                    disabled={role === 'jargon'}
                    onClick={() => setUseSearch((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 ${
                      useSearch && role !== 'jargon'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-[#FAF9F7] text-[#181C25]/75 border-[#181C25]/12 hover:text-[#181C25]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>Google Search {useSearch && role !== 'jargon' ? 'On' : 'Off'}</span>
                  </button>

                  {messages.length > 1 && (
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#181C25]/75 hover:text-[#181C25] bg-[#FAF9F7] border border-[#181C25]/12 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>New Chat</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {interactionMode === 'voice' ? (
            <VoiceChatPanel />
          ) : (
            <>
              {/* Chatbot Role Selector */}
          <div
            role="tablist"
            aria-label="Choose chatbot role"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl w-fit"
          >
            {ROLE_OPTIONS.map((opt) => {
              const selected = opt.id === role;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setRole(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'bg-white text-[#181C25] shadow-xs border border-[#181C25]/10'
                      : 'text-[#181C25]/65 hover:text-[#181C25]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Scrollable Multi-Turn Conversation Thread */}
          <div
            ref={threadRef}
            aria-live="polite"
            className="max-h-[400px] overflow-y-auto space-y-4 pr-1 py-2 border-y border-[#181C25]/8"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3.5 space-y-2 ${
                      isUser
                        ? 'bg-[#181C25] text-white'
                        : 'bg-[#FAF9F7] border border-[#181C25]/8 text-[#181C25]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-medium opacity-65">
                      {!isUser && <MessageSquare className="w-3.5 h-3.5 text-[#FF444F] shrink-0" />}
                      <span>{isUser ? 'You' : activeRoleMeta.label}</span>
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-[#181C25]/10 space-y-1.5">
                        <p className="text-[11px] font-medium text-[#181C25]/55">
                          Sources from Google Search
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src) => (
                            <a
                              key={src.uri}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#181C25] hover:text-[#FF444F] underline underline-offset-2"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.notice && (
                      <p className="text-[11px] text-[#181C25]/55">{msg.notice}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#FAF9F7] border border-[#181C25]/8 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs font-medium text-[#181C25]/70">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF444F]" />
                  <span>
                    {useSearch && role !== 'jargon'
                      ? 'Checking live market context & writing plain-English reply...'
                      : 'Writing plain-English reply...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* One-Click Starter Questions */}
          <div>
            <p className="text-xs font-medium text-[#181C25]/55 mb-2">
              Ask a quick starter question or follow up below
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(q)}
                  className="text-left px-3 py-1.5 text-xs font-medium text-[#181C25] bg-[#FAF9F7] hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="px-4 py-3 text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl"
            >
              {errorMsg}
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="plain-english-guide-input" className="sr-only">
              Type a message to Deriv&apos;s plain-English chatbot
            </label>
            <input
              id="plain-english-guide-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up, compare Gold vs. Crypto, or paste any jargon..."
              maxLength={400}
              className="flex-1 min-w-0 px-4 py-3 text-sm text-[#181C25] placeholder:text-[#181C25]/45 bg-white border border-[#181C25]/20 rounded-xl focus:outline-none focus:border-[#181C25] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#181C25] hover:bg-[#2A303E] disabled:opacity-50 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Send</span>
            </button>
          </form>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#181C25]/60">
            <span>Conversation stays in plain English—never financial advice.</span>
            <button
              type="button"
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1.5 font-semibold text-[#FF444F] hover:text-[#E03640] cursor-pointer"
            >
              <span>Practice in Free $10,000 Demo</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
