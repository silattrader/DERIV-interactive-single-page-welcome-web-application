import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';

interface VoiceTranscriptEntry {
  id: string;
  speaker: 'You' | 'Deriv Voice Guide';
  text: string;
}

const VOICE_OPTIONS = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'] as const;

function downsampleTo16k(
  float32Data: Float32Array,
  inputSampleRate: number,
  targetRate = 16000,
): Float32Array {
  if (inputSampleRate === targetRate) return float32Data;
  const ratio = inputSampleRate / targetRate;
  const newLength = Math.round(float32Data.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < float32Data.length; i++) {
      accum += float32Data[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function pcmFloatToBase64(float32Data: Float32Array): string {
  const int16 = new Int16Array(float32Data.length);
  for (let i = 0; i < float32Data.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export function VoiceChatPanel() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [selectedVoice, setSelectedVoice] = useState<(typeof VOICE_OPTIONS)[number]>('Zephyr');
  const [isMuted, setIsMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const stopPlaybackQueue = () => {
    for (const node of activeSourcesRef.current) {
      try {
        node.stop();
      } catch {
        // Ignore already stopped nodes
      }
    }
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
  };

  const cleanupSession = () => {
    stopPlaybackQueue();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (inputCtxRef.current) {
      void inputCtxRef.current.close();
      inputCtxRef.current = null;
    }

    if (outputCtxRef.current) {
      void outputCtxRef.current.close();
      outputCtxRef.current = null;
    }

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    setMicLevel(0);
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      cleanupSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendTranscript = (speaker: 'You' | 'Deriv Voice Guide', chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            text: `${last.text} ${clean}`.replace(/\s+/g, ' ').trim(),
          },
        ];
      }
      return [
        ...prev,
        {
          id: `${speaker}-${Date.now()}-${Math.random()}`,
          speaker,
          text: clean,
        },
      ];
    });
  };

  const playPcmChunk = (base64Audio: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    const float32 = base64ToFloat32(base64Audio);
    if (float32.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((n) => n !== source);
    };
  };

  const startVoiceCall = async () => {
    if (status !== 'idle') return;
    setErrorMsg(null);
    setStatus('connecting');
    setIsMuted(false);
    isMutedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(selectedVoice)}`,
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            ready?: boolean;
            audio?: string;
            inputTranscript?: string;
            outputTranscript?: string;
            interrupted?: boolean;
            error?: string;
          };

          if (msg.error) {
            setErrorMsg(msg.error);
            cleanupSession();
            return;
          }

          if (msg.ready) {
            setStatus('live');
            // Trigger a brief spoken greeting so the visitor immediately hears the guide
            ws.send(
              JSON.stringify({
                text: 'Briefly greet the visitor in one warm sentence and invite them to ask about Deriv, long-term vs. short-term trading, or the $10,000 demo.',
              }),
            );
          }

          if (msg.interrupted) {
            stopPlaybackQueue();
          }

          if (msg.audio) {
            playPcmChunk(msg.audio);
          }

          if (msg.inputTranscript) {
            appendTranscript('You', msg.inputTranscript);
          }

          if (msg.outputTranscript) {
            appendTranscript('Deriv Voice Guide', msg.outputTranscript);
          }
        } catch {
          // Ignore malformed control packets
        }
      };

      ws.onerror = () => {
        setErrorMsg('Unable to connect to the live voice server. Please try again.');
        cleanupSession();
      };

      ws.onclose = () => {
        cleanupSession();
      };

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (isMutedRef.current) {
          setMicLevel(0);
          return;
        }

        const rawChannel = e.inputBuffer.getChannelData(0);
        let peak = 0;
        for (let i = 0; i < rawChannel.length; i++) {
          const abs = Math.abs(rawChannel[i]);
          if (abs > peak) peak = abs;
        }
        setMicLevel(Math.min(100, Math.round(peak * 220)));

        const downsampled = downsampleTo16k(rawChannel, inputCtx.sampleRate, 16000);
        const base64Audio = pcmFloatToBase64(downsampled);
        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
      };
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow microphone permission in your browser to talk live.'
          : 'Could not start microphone capture on this device.';
      setErrorMsg(msg);
      cleanupSession();
    }
  };

  const askQuickSpokenTopic = (topic: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      appendTranscript('You', topic);
      wsRef.current.send(JSON.stringify({ text: topic }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Control Strip */}
      <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#181C25]">
            <Volume2 className="w-4 h-4 text-[#FF444F] shrink-0" />
            <span>Real-Time Voice Guide (Gemini Live)</span>
          </div>
          <p className="text-xs text-[#181C25]/65">
            Speak naturally to ask questions about Deriv, risk caps, or asset classes—interrupt or
            follow up anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label htmlFor="live-voice-select" className="sr-only">
            Choose assistant voice
          </label>
          <select
            id="live-voice-select"
            value={selectedVoice}
            disabled={status !== 'idle'}
            onChange={(e) => setSelectedVoice(e.target.value as (typeof VOICE_OPTIONS)[number])}
            className="px-3 py-2 text-xs font-semibold text-[#181C25] bg-white border border-[#181C25]/15 rounded-lg disabled:opacity-55 cursor-pointer"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                Voice: {v}
              </option>
            ))}
          </select>

          {status === 'idle' ? (
            <button
              type="button"
              onClick={() => void startVoiceCall()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>Start Voice Conversation</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                disabled={status !== 'live'}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                  isMuted
                    ? 'bg-[#181C25] text-white border-[#181C25]'
                    : 'bg-white text-[#181C25] border-[#181C25]/15 hover:border-[#181C25]/40'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Mic Muted' : 'Mute Mic'}</span>
              </button>

              <button
                type="button"
                onClick={cleanupSession}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#181C25] hover:bg-[#2A303E] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 shrink-0" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Mic Level Meter while active */}
      {status !== 'idle' && (
        <div className="bg-white border border-[#181C25]/10 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-medium text-[#181C25]">
            {status === 'connecting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FF444F]" />
                <span>Connecting to live voice session...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-[#0D9488]" />
                <span>{isMuted ? 'Microphone muted' : 'Listening live—speak normally'}</span>
              </>
            )}
          </div>

          <svg
            viewBox="0 0 120 10"
            className="w-28 h-2.5 rounded-full bg-[#FAF9F7] overflow-hidden shrink-0"
            aria-label="Live microphone input level"
          >
            <rect
              x="0"
              y="0"
              width={Math.round((micLevel / 100) * 120)}
              height="10"
              rx="5"
              fill="#0D9488"
            />
          </svg>
        </div>
      )}

      {/* Quick Spoken Topic Prompts during Live Call */}
      {status === 'live' && (
        <div className="flex flex-wrap gap-2">
          {[
            'Explain Multipliers in plain English.',
            'Should I start with a demo or $50?',
            'Compare Gold vs. Crypto for beginners.',
          ].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => askQuickSpokenTopic(topic)}
              className="px-3 py-1.5 text-xs font-medium text-[#181C25] bg-[#FAF9F7] hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-lg transition-colors cursor-pointer"
            >
              Send prompt: &ldquo;{topic}&rdquo;
            </button>
          ))}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl"
        >
          {errorMsg}
        </div>
      )}

      {/* Live Voice Transcript Thread */}
      <div
        ref={transcriptScrollRef}
        aria-live="polite"
        className="max-h-[300px] overflow-y-auto space-y-3 border border-[#181C25]/10 rounded-xl p-4 bg-white"
      >
        {transcripts.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#181C25]/55 text-center py-6">
            Click &ldquo;Start Voice Conversation&rdquo; above to talk live with Deriv&apos;s
            Plain-English Voice Guide. Real-time spoken transcripts will appear here.
          </p>
        ) : (
          transcripts.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl px-4 py-3 text-sm ${
                entry.speaker === 'You'
                  ? 'bg-[#181C25] text-white ml-8'
                  : 'bg-[#FAF9F7] text-[#181C25] border border-[#181C25]/8 mr-8'
              }`}
            >
              <p className="text-[11px] font-medium opacity-65 mb-1">{entry.speaker}</p>
              <p className="leading-relaxed">{entry.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
