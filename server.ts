import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
  type Content,
  type LiveServerMessage,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

type ChatRole = 'guide' | 'strategist' | 'jargon';

interface IncomingMessage {
  role: 'user' | 'model';
  text: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

const VALID_VOICES = new Set(['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir']);

const ROLE_INSTRUCTIONS: Record<ChatRole, string> = {
  guide: `You are Deriv's Plain-English Guide welcoming a first-time visitor in a multi-turn conversation.
Strict rules:
1. Keep each reply concise (under 100 words) in clean plain prose—never use markdown asterisks or noisy bullet clutter.
2. Use zero unexplained financial jargon. If you mention CFDs, Multipliers, Options, or Derived Indices, explain them in everyday words.
3. Be completely honest about trading risks—never promise profits or guaranteed returns.
4. Use live Google Search context when the user asks about current prices, recent market events, or asset news.
5. End with one clear, low-pressure next step on Deriv (like trying the free $10,000 virtual demo account).`,

  strategist: `You are Deriv's Investor & Trader Orientation Coach helping visitors decide between long-term investing and short-term trading.
Strict rules:
1. Keep each reply concise (under 110 words) in plain prose without markdown asterisks.
2. Compare long-term position holding (CFDs on Stocks, Gold, or Crypto) against short-term capped-risk trading (Multipliers and Options) objectively and honestly.
3. Explain risks clearly—never guarantee returns.
4. Use live Google Search context when discussing recent asset trends.
5. End with one concrete next step they can test in Deriv's $10,000 demo account.`,

  jargon: `You are Deriv's Fast Jargon Translator. Your sole job is to translate financial terms (like CFDs, leverage, spreads, pips, Multipliers, swap-free accounts, or Volatility Indices) into crystal-clear everyday English in 2-4 sentences without markdown asterisks, always noting risk honestly.`,
};

const VOICE_SYSTEM_INSTRUCTION = `You are Deriv's Plain-English Voice Guide speaking live with a first-time visitor.
Rules for spoken responses:
1. Speak warmly, naturally, and concisely (2-4 short sentences per turn).
2. Avoid unexplained financial jargon—translate terms like CFDs, Multipliers, or Derived Indices into everyday comparisons.
3. Be honest that all trading involves risk and never promise profits.
4. Help them compare long-term investing vs. short-term capped-risk trading, or explain how Deriv's free $10,000 demo account works.`;

function getStaticFallbackResponse(question: string, role: ChatRole): string {
  const q = question.toLowerCase();

  if (role === 'jargon') {
    return 'In everyday words, trading on Deriv means predicting whether an asset price moves up or down without buying the physical item. With Multipliers, your maximum possible loss is locked to the stake you choose before entering. Always practice in the free $10,000 virtual demo first.';
  }

  if (q.includes('gold') || q.includes('bitcoin') || q.includes('crypto') || q.includes('driving')) {
    return 'Gold and Bitcoin prices typically respond to US dollar strength, interest-rate expectations, and global risk sentiment. On Deriv, you can track both Gold (XAU/USD) and Bitcoin (BTC/USD) in one place without holding physical bars or managing crypto wallets. Keep in mind that volatile swings carry real risk of loss. Next step: Open the free $10,000 demo sandbox and switch between Gold and Crypto to practice risk-free.';
  }

  if (q.includes('50') || q.includes('zero experience') || q.includes('beginner') || q.includes('start')) {
    return "You don't need to risk your $50 right away. On Deriv, start with a free $10,000 practice account that uses virtual money. You pick an asset like Gold, decide whether its price will go up or down, and set a fixed stake so you know your maximum loss upfront. Trading always carries real risk, so only switch to real funds when you feel ready. Next step: Open the free $10,000 Demo Preview and make three practice predictions today.";
  }

  if (q.includes('cfd') || q.includes('multiplier')) {
    return 'With CFDs (contracts that track price changes without owning the asset), gains and losses move with the market, so you manage risk with manual stop-loss orders. Multipliers amplify potential returns like a magnifying glass while automatically capping your maximum loss at your chosen stake—you can never lose more than you put into that trade. Next step: Test a $10 Multipliers trade inside Deriv’s free $10,000 demo account to feel the difference.';
  }

  if (q.includes('long-term') || q.includes('short-term') || q.includes('investor')) {
    return 'Long-term investors usually hold positions over weeks or months on Gold, Global Stock Indices, or Crypto using swap-free CFD accounts with stop-loss limits. Short-term traders look for faster daily moves using Multipliers or Options where risk is strictly capped at each stake. Both carry real market risk. Next step: Complete the 3-question screening funnel above and test your preferred mode in the $10,000 demo.';
  }

  if (q.includes('lose more') || q.includes('deposit') || q.includes('debt') || q.includes('risk')) {
    return 'No—Deriv includes zero-balance protection, meaning your account cannot drop below zero. With Options and Multipliers, your maximum loss on any single trade is strictly capped at the stake you choose before clicking buy. Still, you can lose the money you trade with, so never trade funds you need for essentials. Next step: Practice setting a $10 stake cap in the free $10,000 virtual demo.';
  }

  return 'Deriv lets you predict whether prices on gold, currencies, stocks, crypto, or 24/7 simulated markets will rise or fall—without buying the whole asset. You choose your stake upfront so your maximum loss is capped on Options and Multipliers, though trading still carries real risk of losing your stake. Next step: Click "Practice Free with $10,000 Virtual Funds" to try your first risk-free prediction.';
}

function extractGroundingSources(
  chunks?: Array<{ web?: { uri?: string; title?: string } }>,
): GroundingSource[] {
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    const uri = chunk?.web?.uri?.trim();
    const title = chunk?.web?.title?.trim();
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({
        uri,
        title: title || new URL(uri).hostname.replace(/^www\./, ''),
      });
    }
    if (sources.length >= 4) break;
  }
  return sources;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  app.post('/api/guide', async (req, res) => {
    const rawMessages: IncomingMessage[] = Array.isArray(req.body?.messages)
      ? req.body.messages
          .filter(
            (m: unknown): m is IncomingMessage =>
              typeof m === 'object' &&
              m !== null &&
              ((m as IncomingMessage).role === 'user' || (m as IncomingMessage).role === 'model') &&
              typeof (m as IncomingMessage).text === 'string' &&
              (m as IncomingMessage).text.trim().length > 0,
          )
          .slice(-16)
      : [];

    const legacyQuestion =
      typeof req.body?.question === 'string' ? req.body.question.trim() : '';

    if (rawMessages.length === 0 && legacyQuestion) {
      rawMessages.push({ role: 'user', text: legacyQuestion });
    }

    const latestMessage = rawMessages[rawMessages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      res.status(400).json({ error: 'Please enter a message to continue the chat.' });
      return;
    }

    const roleKey: ChatRole =
      req.body?.role === 'strategist' || req.body?.role === 'jargon' ? req.body.role : 'guide';
    const useSearchGrounding = req.body?.useSearch !== false && roleKey !== 'jargon';
    const latestText = latestMessage.text.trim().slice(0, 500);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      res.json({
        answer: getStaticFallbackResponse(latestText, roleKey),
        sources: [],
        source: 'fallback',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const history: Content[] = rawMessages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text.slice(0, 800) }],
      }));

      const modelName = roleKey === 'jargon' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

      const sendChat = async (enableSearch: boolean) => {
        const chat = ai.chats.create({
          model: modelName,
          history,
          config: {
            systemInstruction: ROLE_INSTRUCTIONS[roleKey],
            ...(modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
            ...(enableSearch ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });
        return chat.sendMessage({ message: latestText });
      };

      let response;
      try {
        response = await sendChat(useSearchGrounding);
      } catch (searchErr) {
        if (useSearchGrounding) {
          response = await sendChat(false);
        } else {
          throw searchErr;
        }
      }

      const answer = response.text?.trim();
      if (!answer) {
        res.json({
          answer: getStaticFallbackResponse(latestText, roleKey),
          sources: [],
          source: 'fallback',
        });
        return;
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = extractGroundingSources(groundingChunks);

      res.json({
        answer,
        sources,
        model: modelName,
        source: 'gemini',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach AI guide right now.';
      res.status(502).json({
        error: message,
        fallbackAnswer: getStaticFallbackResponse(latestText, roleKey),
        sources: [],
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', (clientWs: WebSocket, req) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          error:
            'Live voice conversations require GEMINI_API_KEY to be configured in Settings > Secrets.',
        }),
      );
      clientWs.close();
      return;
    }

    const reqUrl = new URL(req.url ?? '/live', `http://${req.headers.host ?? 'localhost'}`);
    const requestedVoice = reqUrl.searchParams.get('voice') ?? 'Zephyr';
    const voiceName = VALID_VOICES.has(requestedVoice) ? requestedVoice : 'Zephyr';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let closed = false;
    const sessionPromise = ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: VOICE_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onopen: () => {
          if (!closed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ ready: true, voice: voiceName }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (closed || clientWs.readyState !== WebSocket.OPEN) return;

          const content = message.serverContent;
          if (content?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ inputTranscript: content.inputTranscription.text }),
            );
          }
          if (content?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ outputTranscript: content.outputTranscription.text }),
            );
          }

          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }

          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }
        },
        onerror: (err) => {
          if (!closed && clientWs.readyState === WebSocket.OPEN) {
            const msg = err instanceof Error ? err.message : 'Live voice connection error.';
            clientWs.send(JSON.stringify({ error: msg }));
          }
        },
        onclose: () => {
          if (!closed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
            clientWs.close();
          }
        },
      },
    });

    sessionPromise.catch((err) => {
      if (!closed && clientWs.readyState === WebSocket.OPEN) {
        const msg =
          err instanceof Error ? err.message : 'Unable to start Gemini Live voice session.';
        clientWs.send(JSON.stringify({ error: msg }));
        clientWs.close();
      }
    });

    clientWs.on('message', (raw) => {
      let parsed: { audio?: string; text?: string };
      try {
        parsed = JSON.parse(raw.toString()) as { audio?: string; text?: string };
      } catch {
        return;
      }

      sessionPromise
        .then((session) => {
          if (closed) return;
          if (typeof parsed.audio === 'string' && parsed.audio.length > 0) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
            session.sendRealtimeInput({
              text: parsed.text.trim(),
            });
          }
        })
        .catch(() => {
          // Handled by sessionPromise catch above
        });
    });

    clientWs.on('close', () => {
      closed = true;
      sessionPromise
        .then((session) => {
          session.close();
        })
        .catch(() => {
          // Ignore close cleanup errors
        });
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Deriv welcome server listening on http://localhost:${PORT}`);
  });
}

startServer();
