'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionState, ParticipantEvent, Track } from 'livekit-client';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import {
  useAgent,
  useDataChannel,
  useMaybeRoomContext,
  useSessionContext,
  useSessionMessages,
  useTrackToggle,
  useTrackTranscription,
} from '@livekit/components-react';
import {
  ChatCircleDotsIcon,
  GlobeIcon,
  HouseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { clearArchive, loadBoard } from '@/components/nova/board/archive';
import { Board } from '@/components/nova/board/board';
import { CanvasErrorBoundary } from '@/components/nova/board/error-boundary';
import { Canvas, type CanvasPayload } from '@/components/nova/canvas';
import { TopicPicker } from '@/components/nova/topic-picker';
import {
  LANGS,
  type Lang,
  LangContext,
  readLangCookie,
  useT,
  writeLangCookie,
} from '@/components/nova/i18n';

/**
 * Day 3 frontend for Nova — a Computer Science companion for Telugu-speaking
 * students.
 *
 * Five screens, one per required state:
 *
 *   ready       -> one obvious button, nothing else competing with it
 *   connecting  -> explicit "wait", because the agent takes a moment to join
 *   live        -> who is speaking, right now, unmissable
 *   ended       -> what happened + an obvious way back in
 *   mic-error   -> what went wrong and exactly how to fix it
 *
 * Visual language: warm paper background, one soft card, muted earth tones.
 * A student uses this late at night when something is already going wrong, so
 * the interface stays quiet — no hard contrast, no glow, nothing shouting.
 */

type Screen = 'ready' | 'topic' | 'connecting' | 'live' | 'ended' | 'mic-error';

// Modern Black and White Monochrome Palette with Colored Accent Elements
const C = {
  paper: '#09090B',
  card: '#121215',
  ink: '#F4F4F5',
  inkSoft: '#A1A1AA',
  line: '#27272A',
  clay: '#FFFFFF', // primary action
  sage: '#10B981', // listening
  sky: '#3B82F6', // speaking
  amber: '#F59E0B', // thinking
  rose: '#EF4444', // end / error
};

type AgentTheme = {
  paper: string;
  card: string;
  edge: string;
  accent: string;
  bubble: string;
};

const THEMES: Record<string, AgentTheme> = {
  nova: {
    paper: '#09090B',
    card: '#121215',
    edge: '#27272A',
    accent: '#FFFFFF',
    bubble: '#18181B',
  },
  algo: {
    paper: '#09090B',
    card: '#121215',
    edge: '#27272A',
    accent: '#3B82F6',
    bubble: '#18181B',
  },
  keerthi: {
    paper: '#09090B',
    card: '#121215',
    edge: '#27272A',
    accent: '#10B981',
    bubble: '#18181B',
  },
  vikram: {
    paper: '#09090B',
    card: '#121215',
    edge: '#27272A',
    accent: '#F59E0B',
    bubble: '#18181B',
  },
};

const themeFor = (id: string) => THEMES[id] ?? THEMES.nova;

const AGENT_NAME: Record<string, string> = {
  nova: 'Nova',
  algo: 'Algo',
  keerthi: 'Keerthi',
  vikram: 'Vikram',
};

// ---------------------------------------------------------------------------
// Microphone permission
// ---------------------------------------------------------------------------

type MicError = 'denied' | 'notfound' | 'other';

/** Ask for the mic BEFORE connecting, so a refusal is a clean screen and not a
 *  half-joined call the student has to figure out. */
async function requestMic(): Promise<MicError | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'other';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop()); // LiveKit opens its own track
    return null;
  } catch (err) {
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'notfound';
    return 'other';
  }
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-svh w-full items-center justify-center p-6 pt-24 pb-28"
      style={{ background: C.paper }}
    >
      <div className="w-full max-w-xl flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
}

function Mark({ tint = C.clay, pulse = false }: { tint?: string; pulse?: boolean }) {
  return (
    <div className="relative mb-6 flex size-16 items-center justify-center">
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: tint, opacity: 0.16 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.18, 0.04, 0.18] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div
        className="relative flex size-16 items-center justify-center rounded-full font-mono text-xl font-semibold"
        style={{ background: `${tint}1A`, color: tint }}
      >
        AA
      </div>
    </div>
  );
}

/** Soft rounded bars. Calm when idle, lively when the agent speaks. */
function Bars({ tint, active }: { tint: string; active: boolean }) {
  const heights = [8, 15, 22, 15, 8];
  return (
    <div className="flex h-6 items-center justify-center gap-1">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full"
          style={{ background: tint, opacity: active ? 0.9 : 0.28 }}
          animate={
            active ? { height: [h * 0.45, h, h * 0.55, h * 0.9, h * 0.45] } : { height: h * 0.4 }
          }
          transition={
            active
              ? { duration: 1.1, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
        />
      ))}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  tint = C.clay,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tint?: string;
}) {
  const isWhite = tint === '#FFFFFF' || tint === C.clay;
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl py-4 text-[17px] font-semibold transition hover:opacity-90 active:scale-[0.985] ${isWhite ? 'text-black bg-white' : 'text-white'
        }`}
      style={{
        background: tint,
        boxShadow: isWhite
          ? '0 4px 14px rgba(255,255,255,0.18)'
          : `0 6px 16px ${tint}33`,
      }}
    >
      {children}
    </button>
  );
}

function FormattedChatMessage({ text, isMine }: { text: string; isMine?: boolean }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={idx} className="h-1.5" />;
        }

        // Check if line is a bullet item
        const isBullet =
          line.startsWith('• ') ||
          line.startsWith('- ') ||
          (line.startsWith('* ') && !line.startsWith('**'));
        const content = isBullet ? line.replace(/^(?:•|\-|\*)\s+/, '') : line;

        // Split by markdown delimiters: bold (**...**), italic (*...*), code (`...`)
        const tokens = content.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|`[\s\S]*?`)/g);

        return (
          <div
            key={idx}
            className={`leading-relaxed ${isBullet ? 'flex items-start gap-1.5 pl-1' : ''}`}
          >
            {isBullet && (
              <span className={`shrink-0 select-none ${isMine ? 'text-zinc-500' : 'text-zinc-400'}`}>
                •
              </span>
            )}
            <span className="flex-1 min-w-0">
              {tokens.map((token, tIdx) => {
                if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
                  const inner = token.slice(2, -2).replaceAll('**', '');
                  return (
                    <strong
                      key={tIdx}
                      className={`font-bold ${isMine ? 'text-zinc-950' : 'text-[#FFFFFF]'}`}
                    >
                      {inner}
                    </strong>
                  );
                }
                if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
                  return (
                    <em key={tIdx} className="italic opacity-90">
                      {token.slice(1, -1)}
                    </em>
                  );
                }
                if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
                  return (
                    <code
                      key={tIdx}
                      className={`px-1 py-0.5 rounded font-mono text-[11px] ${
                        isMine
                          ? 'bg-zinc-200 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-200 border border-zinc-700/60'
                      }`}
                    >
                      {token.slice(1, -1)}
                    </code>
                  );
                }
                // Strip any stray unclosed or leftover **
                const cleanToken = token.replaceAll('**', '');
                return cleanToken;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. READY
// ---------------------------------------------------------------------------

function ReadyScreen({ onStart, onOpen }: { onStart: () => void; onOpen: (c: Chat) => void }) {
  const t = useT();
  return (
    <Shell>
      <Mark />
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: C.inkSoft }}>
        {t.tagline}
      </p>
      <h1 className="mt-2.5 text-[32px] font-bold" style={{ color: C.ink }}>
        Agent Arex
      </h1>
      <p
        className="mt-3 mb-9 max-w-lg text-center text-[16px] leading-relaxed"
        style={{ color: C.inkSoft }}
      >
        {t.readyBody}
      </p>

      <div className="mb-4 w-full">
        <LanguagePicker />
      </div>
      <PrimaryButton onClick={onStart}>{t.start}</PrimaryButton>

      <p className="mt-4 text-[12px]" style={{ color: C.inkSoft }}>
        {t.micNote}
      </p>
      <ChatHistory onOpen={onOpen} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 2. CONNECTING
// ---------------------------------------------------------------------------

function ConnectingScreen() {
  const t = useT();
  return (
    <Shell>
      <Mark pulse />
      <h2 className="text-[22px] font-bold" style={{ color: C.ink }}>
        {t.connecting}
      </h2>
      <p className="mt-2 text-center text-[15px]" style={{ color: C.inkSoft }}>
        {t.connectingBody}
      </p>
      <div className="mt-7 flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full"
            style={{ background: C.clay }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <p
        className="mt-7 font-mono text-[10px] tracking-[0.22em] uppercase"
        style={{ color: C.inkSoft }}
      >
        connecting
      </p>
    </Shell>
  );
}

type Line = { id: string; mine: boolean; text: string; at: number };

// ---------------------------------------------------------------------------
// Chat history — kept in this browser across classes
// ---------------------------------------------------------------------------

type Saved = Line & { who: string };
type Chat = { id: string; at: number; lines: Saved[] };
const CHATS_KEY = 'aa_chats';
const OLD_HISTORY_KEY = 'aa_chat_history'; // flat log from before chats existed

function loadChats(): Chat[] {
  try {
    const chats = JSON.parse(localStorage.getItem(CHATS_KEY) ?? '[]') as Chat[];
    const old = localStorage.getItem(OLD_HISTORY_KEY);
    if (old) {
      const lines = JSON.parse(old) as Saved[];
      if (lines.length) chats.push({ id: 'earlier', at: lines[0].at || 0, lines });
      localStorage.removeItem(OLD_HISTORY_KEY);
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    }
    return chats.sort((x, y) => y.at - x.at);
  } catch {
    return [];
  }
}

function saveChat(chat: Chat) {
  try {
    const rest = loadChats().filter((c) => c.id !== chat.id);
    localStorage.setItem(CHATS_KEY, JSON.stringify([chat, ...rest].slice(0, 30)));
  } catch {
    /* storage full or blocked: history is a convenience, not a requirement */
  }
}

function clearChats() {
  try {
    localStorage.removeItem(CHATS_KEY);
  } catch {
    /* ignore */
  }
}

/** Previous chats, newest first; click one to read it. */
function ChatHistory({ onOpen }: { onOpen: (chat: Chat) => void }) {
  const t = useT();
  const [chats, setChats] = useState<Chat[]>([]);
  useEffect(() => setChats(loadChats()), []);
  if (!chats.length) return null;
  return (
    <div className="mt-7 w-full">
      <div className="mb-2 flex items-center justify-between">
        <p
          className="font-mono text-[10px] tracking-[0.18em] uppercase"
          style={{ color: C.inkSoft }}
        >
          {t.history}
        </p>
        <button
          onClick={() => {
            clearChats();
            void clearArchive();
            setChats([]);
          }}
          className="text-[12px] underline"
          style={{ color: C.inkSoft }}
        >
          {t.clearHistory}
        </button>
      </div>
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {chats.map((c) => {
          const first = c.lines.find((l) => l.mine)?.text || c.lines[0]?.text || '…';
          return (
            <div
              key={c.id}
              className="rounded-2xl"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <button
                onClick={() => onOpen(c)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
              >
                <span
                  className="min-w-0 flex-1 truncate text-[14px] font-semibold"
                  style={{ color: C.ink }}
                >
                  {first}
                </span>
                <span className="shrink-0 font-mono text-[10px]" style={{ color: C.inkSoft }}>
                  {c.at
                    ? new Date(c.at).toLocaleDateString([], { day: 'numeric', month: 'short' })
                    : ''}
                  {' · '}
                  {c.lines.length}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryLine({ line, dim }: { line: Saved; dim?: boolean }) {
  return (
    <div className={line.mine ? 'text-right' : 'text-left'} style={{ opacity: dim ? 0.6 : 1 }}>
      <span
        className="mb-1 block font-mono text-[9px] tracking-[0.14em] uppercase"
        style={{ color: C.inkSoft }}
      >
        {line.who}
      </span>
      <span
        className="inline-block max-w-[88%] rounded-xl px-3 py-1.5 text-[14px] leading-relaxed"
        style={{ background: line.mine ? C.line : `${C.clay}1A`, color: C.ink }}
      >
        {line.text}
      </span>
    </div>
  );
}

/** Collapse repeats of the same speaker saying the same thing.
 *  Interim and final segments can arrive under different ids. */
function dedupe(lines: Line[]): Line[] {
  const seen = new Set<string>();
  const out: Line[] = [];
  for (const line of lines) {
    const key = `${line.mine}:${line.text.trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. LIVE — listening / thinking / speaking
// ---------------------------------------------------------------------------

const STATUS: Record<
  string,
  { key: 'listening' | 'thinking' | 'speaking'; en: string; tint: string }
> = {
  listening: { key: 'listening', en: 'listening to you', tint: C.sage },
  thinking: { key: 'thinking', en: 'thinking', tint: C.amber },
  speaking: { key: 'speaking', en: 'agent is speaking', tint: C.sky },
};

/** Square control: icon on top, a short label underneath. */
function ControlButton({
  label,
  onClick,
  edge,
  paper,
  alert = false,
  children,
}: {
  label: string;
  onClick: () => void;
  edge: string;
  paper: string;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-[60px] w-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition hover:brightness-[0.97] active:scale-[0.97]"
      style={{
        background: alert ? `${C.rose}14` : paper,
        border: `1px solid ${alert ? `${C.rose}55` : edge}`,
        color: alert ? C.rose : C.ink,
      }}
    >
      {children}
      <span className="w-full truncate px-1 text-center text-[10.5px] leading-none font-semibold">
        {label}
      </span>
    </button>
  );
}

function LiveScreen({
  chatId,
  initialTopic,
  onTopicError,
  resume,
  onHome,
  onNewChat,
  onEnd,
  canvas,
  agent: who,
  handoffs,
}: {
  chatId: string;
  initialTopic: string | null;
  onTopicError: () => void;
  resume: Chat | null;
  onHome: () => void;
  onNewChat: () => void;
  onEnd: () => void;
  canvas: CanvasPayload[];
  agent: { id: string; name: string; role: string; tint: string; lang: string };
  handoffs: { id: string; from: string; to: string; reason: string; at: number }[];
}) {
  const agent = useAgent();
  const session = useSessionContext();
  const tr = useT();
  const { lang } = useContext(LangContext);
  // Board's child effects subscribe before this effect publishes the topic.
  // Attributes also reach an agent that finishes joining after the selection.
  useEffect(() => {
    if (!initialTopic || !session.room || !session.isConnected) return;
    void session.room.localParticipant.setAttributes({ lesson_topic: initialTopic, language: lang })
      .catch(onTopicError);
  }, [initialTopic, session.room, session.isConnected, lang, onTopicError]);

  const [activeBoard, setActiveBoard] = useState('b1');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(380);
  const [isAgentMuted, setIsAgentMuted] = useState(false);
  const isResizingRef = useRef(false);

  // Draggable resize handler for chat box
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - moveEvent.clientX;
      setChatWidth(Math.max(260, Math.min(newWidth, Math.max(300, window.innerWidth - 350))));
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Agent mute toggle
  const toggleAgentMute = useCallback(() => {
    setIsAgentMuted((prev) => {
      const next = !prev;
      if (session.room) {
        session.room.remoteParticipants.forEach((p) => {
          p.audioTrackPublications.forEach((pub) => {
            if (pub.track) {
              try {
                (pub.track as any).setVolume(next ? 0 : 1);
              } catch (e) { }
              if ((pub.track as any).mediaStreamTrack) {
                (pub.track as any).mediaStreamTrack.enabled = !next;
              }
            }
          });
        });
        const audioEls = document.querySelectorAll('audio');
        audioEls.forEach((el) => {
          el.muted = next;
        });
      }
      return next;
    });
  }, [session.room]);

  // Keep agent mute enforced if new audio tracks are subscribed
  useEffect(() => {
    if (!session.room) return;
    const applyMute = () => {
      session.room?.remoteParticipants.forEach((p) => {
        p.audioTrackPublications.forEach((pub) => {
          if (pub.track) {
            try {
              (pub.track as any).setVolume(isAgentMuted ? 0 : 1);
            } catch (e) { }
            if ((pub.track as any).mediaStreamTrack) {
              (pub.track as any).mediaStreamTrack.enabled = !isAgentMuted;
            }
          }
        });
      });
      const audioEls = document.querySelectorAll('audio');
      audioEls.forEach((el) => {
        el.muted = isAgentMuted;
      });
    };
    applyMute();
    session.room.on('trackSubscribed', applyMute);
    return () => {
      session.room?.off('trackSubscribed', applyMute);
    };
  }, [session.room, isAgentMuted]);

  const [chatInput, setChatInput] = useState('');
  const [customMessages, setCustomMessages] = useState<
    { id: string; mine: boolean; text: string; at: number }[]
  >([]);
  const [sendingChat, setSendingChat] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Listen for agent-pushed structured notes and key points
  useDataChannel('nova-chat', (msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === 'chat_message' && data.text) {
        setCustomMessages((prev) => {
          if (data.id && prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id || `a-txt-${Date.now()}`,
              mine: false,
              text: data.text,
              at: data.at || Date.now(),
            },
          ];
        });
      }
    } catch (err) {
      console.error('Failed to parse nova-chat message:', err);
    }
  });

  const sendChatMessage = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || !session.room || !session.isConnected || sendingChat) return;
    setSendingChat(true);
    const msgId = `u-txt-${Date.now()}`;
    const newMsg = { id: msgId, mine: true, text, at: Date.now() };
    setCustomMessages((prev) => [...prev, newMsg]);
    if (!overrideText) setChatInput('');
    try {
      await session.room.localParticipant.sendText(
        JSON.stringify({ type: 'chat_message', text, board: activeBoard }),
        { topic: 'nova-board-student' }
      );
    } catch (err) {
      console.error('Failed to send chat message:', err);
    } finally {
      setSendingChat(false);
    }
  };
  const [sendingAction, setSendingAction] = useState(false);
  const actionInFlight = useRef(false);
  const [actionFeedback, setActionFeedback] = useState<'sent' | 'failed' | null>(null);
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);
  const requestLearningAction = async (action: 'simplify' | 'example' | 'check') => {
    if (!session.room || !session.isConnected || !agent.isConnected || actionInFlight.current) return;
    actionInFlight.current = true;
    setSendingAction(true);
    setActionFeedback(null);
    try {
      await session.room.localParticipant.sendText(
        JSON.stringify({ type: 'learning_action', action, board: activeBoard }),
        { topic: 'nova-board-student' }
      );
      setActionFeedback('sent');
    } catch {
      setActionFeedback('failed');
    } finally {
      actionInFlight.current = false;
      setSendingAction(false);
    }
  };

  // Transcripts come straight off the audio tracks. useSessionMessages only
  // carries typed chat, so on a voice-only call it stays empty — reading the
  // tracks is what actually produces a live transcript.
  const agentTrack = agent.isConnected ? agent.microphoneTrack : undefined;
  const localTrack = session.isConnected ? session.local.microphoneTrack : undefined;
  const { segments: agentSegments } = useTrackTranscription(agentTrack);
  const { segments: userSegments } = useTrackTranscription(localTrack);

  // Track segments are the only source. Session messages are NOT merged in:
  // with text_output enabled the agent publishes each utterance as a message
  // as well, so including both prints every line twice.
  const lines = dedupe(
    [
      ...userSegments.map((sg) => ({
        id: `u-${sg.id}`,
        mine: true,
        text: sg.text,
        at: sg.firstReceivedTime,
        final: sg.final,
      })),
      ...agentSegments.map((sg) => ({
        id: `a-${sg.id}`,
        mine: false,
        text: sg.text,
        at: sg.firstReceivedTime,
        final: sg.final,
      })),
    ]
      .filter((l) => l.text?.trim())
      .sort((a, b) => a.at - b.at)
  );

  const allMessages = useMemo(() => {
    const combined = [...lines, ...customMessages];
    const map = new Map<string, (typeof combined)[0]>();
    for (const m of combined) {
      map.set(m.id, m);
    }
    return Array.from(map.values()).sort((a, b) => a.at - b.at);
  }, [lines, customMessages]);

  useEffect(() => {
    chatFeedRef.current?.scrollTo({ top: chatFeedRef.current.scrollHeight, behavior: 'smooth' });
  }, [allMessages.length]);
  // This class is its own chat, saved as it happens. A continued chat keeps
  // its earlier lines in front.
  const previous = useMemo(() => resume?.lines ?? [], [resume]);
  useEffect(() => {
    if (!lines.length) return;
    saveChat({
      id: chatId,
      at: previous[0]?.at || lines[0].at || Date.now(),
      lines: [...previous, ...lines.map((l) => ({ ...l, who: l.mine ? tr.you : who.name }))],
    });
  }, [lines, previous, chatId, tr.you, who.name]);

  // Continuing a chat: once the teacher is in the room, hand it the old
  // conversation and board so it can pick up where it left off.
  const handedOver = useRef(false);
  useEffect(() => {
    if (!resume || handedOver.current || !agent.isConnected || !session.room) return;
    handedOver.current = true;
    const room = session.room;
    void (async () => {
      const saved = await loadBoard<{ book: unknown }>(chatId);
      const transcript = resume.lines
        .slice(-40)
        .map((l) => `${l.mine ? 'Student' : 'Teacher'}: ${l.text}`)
        .join('\n');
      await room.localParticipant
        .sendText(JSON.stringify({ type: 'resume', transcript, book: saved?.book }), {
          topic: 'nova-board-student',
        })
        .catch(() => { });
    })();
  }, [resume, agent.isConnected, session.room, chatId]);

  const { toggle: toggleMic, enabled: micOn } = useTrackToggle({
    source: Track.Source.Microphone,
    publishOptions: {
      stopMicTrackOnMute: true,
    },
  });

  // Ensure any published local microphone track stops the browser device on mute
  useEffect(() => {
    const room = session.room;
    if (!room) return;
    const ensureStopOnMute = () => {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (pub?.track && 'stopOnMute' in pub.track) {
        (pub.track as any).stopOnMute = true;
      }
    };
    ensureStopOnMute();
    room.localParticipant.on(ParticipantEvent.LocalTrackPublished, ensureStopOnMute);
    return () => {
      room.localParticipant.off(ParticipantEvent.LocalTrackPublished, ensureStopOnMute);
    };
  }, [session.room]);

  const handleToggleMic = useCallback(async () => {
    try {
      const room = session.room;
      const pub = room?.localParticipant?.getTrackPublication(Track.Source.Microphone);
      const track = pub?.track;
      if (track && 'stopOnMute' in track) {
        (track as any).stopOnMute = true;
      }
      if (micOn) {
        await toggleMic(false);
        // Explicitly stop the browser MediaStreamTrack if still active so the recording indicator turns off
        if (track?.mediaStreamTrack && track.mediaStreamTrack.readyState !== 'ended') {
          track.mediaStreamTrack.stop();
        }
      } else {
        await toggleMic(true);
      }
    } catch (err) {
      console.error('Failed to toggle microphone:', err);
    }
  }, [micOn, toggleMic, session.room]);

  const state = agent.state === 'connecting' ? 'thinking' : agent.state;
  const status = STATUS[state] ?? STATUS.thinking;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines.length]);

  const latestAgentSpeech = useMemo(
    () => lines.filter((l) => !l.mine).slice(-1)[0]?.text,
    [lines]
  );

  // The speech card starts above the dock, but a student can move it away
  // from whatever they are studying. Dragging is intentionally header-only
  // so the transcript remains selectable and scrollable.
  const speechRef = useRef<HTMLDivElement>(null);
  const speechDragControls = useDragControls();
  const [speechDragBounds, setSpeechDragBounds] = useState({ top: -800, right: 320, bottom: 0, left: -320 });
  useEffect(() => {
    const updateBounds = () => {
      const card = speechRef.current?.getBoundingClientRect();
      if (!card) return;
      setSpeechDragBounds({
        top: Math.min(0, 16 - card.top),
        right: Math.max(0, window.innerWidth - card.right - 16),
        bottom: 0, // preserve the dock's clear interaction area
        left: Math.min(0, 16 - card.left),
      });
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [latestAgentSpeech]);

  const t = themeFor(who.id);
  const [needsLandscape, setNeedsLandscape] = useState(false);
  useEffect(() => {
    const portraitPhone = window.matchMedia('(max-width: 767px) and (orientation: portrait) and (pointer: coarse)');
    const updateOrientation = () => setNeedsLandscape(portraitPhone.matches);
    updateOrientation();
    portraitPhone.addEventListener('change', updateOrientation);
    return () => portraitPhone.removeEventListener('change', updateOrientation);
  }, []);

  // Handoffs sit inside the transcript, in sequence, so the student can see
  // exactly where the conversation changed hands and why.
  const feed = [
    ...lines.map((l) => ({ kind: 'line' as const, at: l.at, line: l })),
    ...handoffs.map((h) => ({ kind: 'handoff' as const, at: h.at, handoff: h })),
  ].sort((a, b) => a.at - b.at);

  return (
    <div className="nova-lesson relative flex flex-col h-svh w-full overflow-hidden" style={{ background: t.paper }}>
      {needsLandscape && (
        <div role="status" style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: t.paper, color: C.ink }}>
          <span aria-hidden="true" className="text-4xl">↻</span>
          <h2 className="text-xl font-semibold">Rotate your phone to continue</h2>
          <p>Use landscape mode for a readable whiteboard and lesson controls.</p>
        </div>
      )}
      {/* Whiteboard Canvas + Interactive Text Chat Panel (Split Screen) */}
      <div
        className="flex-1 min-h-0 w-full flex relative overflow-hidden"
        style={{ visibility: needsLandscape ? 'hidden' : undefined }}
      >
        {/* Left: Whiteboard Canvas */}
        <main className="flex-1 min-w-0 h-full relative overflow-hidden">
          <CanvasErrorBoundary name="Whiteboard Canvas">
            <Board
              chatId={chatId}
              restore={!!resume}
              lines={lines}
              onActiveBoardChange={setActiveBoard}
              fallback={canvas.length ? <Canvas items={canvas} /> : undefined}
              isSpeaking={agent.state === 'speaking'}
              isListening={
                agent.state === 'listening' ||
                (session.local.microphoneTrack?.publication
                  ? !session.local.microphoneTrack.publication.isMuted
                  : false)
              }
              roomState={session.room?.state}
            />
          </CanvasErrorBoundary>

          {/* Live speech explanation banner - shown only in fallback canvas mode; whiteboard renders on-canvas speech */}
          <AnimatePresence>
            {latestAgentSpeech && canvas.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl pointer-events-none">
                <motion.div
                  ref={speechRef}
                  key="live-speech-card"
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  drag
                  dragControls={speechDragControls}
                  dragListener={false}
                  dragConstraints={speechDragBounds}
                  dragElastic={0}
                  dragMomentum={false}
                  className="w-full pointer-events-auto"
                >
                  <div
                    className="flex items-start gap-3 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-xl border border-[#27272A] bg-[#121215]/95"
                    style={{
                      boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <div
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: `${who.tint}22`, color: who.tint }}
                      title="Arex speaking"
                    >
                      AR
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="mb-0.5 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none"
                        onPointerDown={(event) => speechDragControls.start(event)}
                        title="Drag to move this speech card"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#A1A1AA]">
                            {who.name} Speaking
                          </span>
                          <span className="inline-block size-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                        </div>
                      </div>
                      <div
                        className="text-[14px] leading-relaxed select-text font-medium text-[#F4F4F5] max-h-24 overflow-y-auto"
                        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                      >
                        <FormattedChatMessage text={latestAgentSpeech} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Right: Modern Black & White Interactive Text Chat Panel (Resizable) */}
        {isChatOpen && (
          <aside
            style={{ width: `${chatWidth}px` }}
            className="relative shrink-0 h-full flex flex-col bg-[#09090B] border-l border-[#27272A] z-30 transition-[width] duration-75"
          >
            {/* Drag Resize Handle */}
            <div
              onMouseDown={startResizing}
              className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize z-40 group flex items-center justify-center hover:bg-[#3B82F6]/20 transition-colors select-none"
              title="Drag to resize chat panel"
            >
              <div className="w-0.5 h-10 rounded-full bg-[#52525B] group-hover:bg-[#3B82F6] transition-colors" />
            </div>

            {/* Chat Header */}
            <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[#27272A] bg-[#121215]">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[13px] font-bold text-[#FFFFFF]">Tutor Chat</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#27272A] bg-[#18181B] text-[#A1A1AA]">
                  {who.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Agent Audio Mute / Speaker Toggle in Header */}
                <button
                  type="button"
                  onClick={toggleAgentMute}
                  className={`p-1.5 rounded-lg border text-[12px] transition-colors ${isAgentMuted
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
                    }`}
                  title={isAgentMuted ? "Unmute tutor voice" : "Mute tutor voice"}
                >
                  {isAgentMuted ? <SpeakerSlashIcon size={15} /> : <SpeakerHighIcon size={15} />}
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-[#71717A] hover:text-[#FFFFFF] transition-colors p-1 rounded-md"
                  title="Collapse chat"
                >
                  <XIcon size={16} />
                </button>
              </div>
            </div>

              {/* Message Feed */}
              <div ref={chatFeedRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {allMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#71717A]">
                    <div className="size-10 rounded-full border border-[#27272A] bg-[#18181B] flex items-center justify-center mb-3 text-[#A1A1AA]">
                      <ChatCircleDotsIcon size={20} />
                    </div>
                    <p className="text-[13px] font-medium text-[#E4E4E7]">Interactive Classroom Chat</p>
                    <p className="text-[11px] text-[#71717A] mt-1 max-w-[210px]">
                      Speak or type your questions below. The teacher explains and draws on the board!
                    </p>
                  </div>
                ) : (
                  allMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.mine ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-medium text-[#71717A] mb-1 px-1">
                        {msg.mine ? 'You' : who.name}
                      </span>
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed select-text ${msg.mine
                            ? 'bg-[#FFFFFF] text-[#000000] font-medium rounded-tr-xs shadow-sm'
                            : 'bg-[#18181B] text-[#F4F4F5] border border-[#27272A] rounded-tl-xs'
                          }`}
                      >
                        <FormattedChatMessage text={msg.text} isMine={msg.mine} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendChatMessage();
                }}
                className="p-3 border-t border-[#27272A] bg-[#121215] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a question or message..."
                  className="flex-1 min-w-0 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-[13px] text-[#FFFFFF] placeholder:text-[#71717A] focus:outline-none focus:border-[#FFFFFF] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat}
                  className="size-9 rounded-xl bg-[#FFFFFF] text-[#000000] flex items-center justify-center hover:bg-[#E4E4E7] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 font-bold"
                  title="Send message"
                >
                  <PaperPlaneTiltIcon size={16} weight="bold" />
                </button>
              </form>
            </aside>
        )}
          </div>

      {/* Reserved Dock Viewport Footer (never overlays whiteboard canvas; respects safe areas) */}
        <footer
          className="nova-lesson-footer shrink-0 z-40 flex flex-col items-center justify-center w-full px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-transparent"
          style={{
            visibility: needsLandscape ? 'hidden' : undefined,
          }}
        >
          {/* Dock Controls */}
          <div className="nova-lesson-dock flex max-w-full items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.6)] text-white select-none">
            {/* Teacher avatar & name */}
            <div className="flex items-center gap-2 pr-2.5 border-r border-zinc-800">
              <div className="flex size-7 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 font-mono text-[11px] font-bold text-white shadow-xs">
                AR
              </div>
              <span className="text-xs font-semibold text-zinc-200 hidden sm:inline tracking-tight">
                {who.name}
              </span>
            </div>

            {/* Status & Audio Waveform */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                state === 'thinking'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : state === 'speaking' || state === 'listening'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
              }`}
            >
              <motion.span
                className={`size-2 rounded-full ${
                  state === 'thinking'
                    ? 'bg-amber-400'
                    : state === 'speaking' || state === 'listening'
                    ? 'bg-emerald-400'
                    : 'bg-zinc-500'
                }`}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-xs font-medium hidden md:inline">
                {tr[status.key]}
              </span>
              <div className="nova-dock-waveform">
                <Bars
                  tint={
                    state === 'thinking'
                      ? '#fbbf24'
                      : state === 'speaking' || state === 'listening'
                      ? '#34d399'
                      : '#71717a'
                  }
                  active={state === 'speaking' || state === 'listening'}
                />
              </div>
            </div>

            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => void handleToggleMic()}
              title={micOn ? tr.micOff : tr.micOn}
              className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 shadow-2xs ${
                micOn
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
              }`}
            >
              {micOn ? <MicrophoneIcon size={17} weight="bold" /> : <MicrophoneSlashIcon size={17} weight="bold" />}
            </button>

            {/* Agent Speaker Mute Toggle */}
            <button
              type="button"
              onClick={toggleAgentMute}
              title={isAgentMuted ? "Unmute tutor voice" : "Mute tutor voice"}
              className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 shadow-2xs ${
                !isAgentMuted
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isAgentMuted ? <SpeakerSlashIcon size={17} weight="bold" /> : <SpeakerHighIcon size={17} weight="bold" />}
            </button>

            {/* Language Selector */}
            <LanguagePicker compact />

            {/* Home */}
            <button
              type="button"
              onClick={onHome}
              title={tr.home}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-2xs"
            >
              <HouseIcon size={17} weight="bold" />
            </button>

            {/* Chat Panel Toggle */}
            <button
              type="button"
              onClick={() => setIsChatOpen((v) => !v)}
              title={isChatOpen ? "Hide chat panel" : "Open chat panel"}
              className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 shadow-2xs ${
                isChatOpen
                  ? 'bg-white text-zinc-950 font-bold shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <ChatCircleDotsIcon size={17} weight={isChatOpen ? "fill" : "bold"} />
            </button>

            {/* New Chat */}
            <button
              type="button"
              onClick={onNewChat}
              title={tr.newChat}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-2xs"
            >
              <PlusIcon size={17} weight="bold" />
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={onEnd}
              title={tr.endCall}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all active:scale-95 shadow-xs"
            >
              <XIcon size={14} weight="bold" />
              <span className="hidden md:inline">{tr.endCall}</span>
            </button>
          </div>
        </footer>
      </div>
      );
}

      // ---------------------------------------------------------------------------
      // 4. CALL ENDED
      // ---------------------------------------------------------------------------

      function EndedScreen({
        turns,
        onRestart,
        onOpen,
}: {
        turns: number;
  onRestart: () => void;
  onOpen: (c: Chat) => void;
}) {
  const t = useT();
      return (
      <Shell>
        <Mark tint={C.sage} />
        <h2 className="text-[22px] font-bold" style={{ color: C.ink }}>
          {t.ended}
        </h2>
        <p className="mt-2 mb-8 text-center text-[15px]" style={{ color: C.inkSoft }}>
          {turns > 0 ? t.endedTurns(turns) : t.endedNone}
        </p>
        <PrimaryButton onClick={onRestart}>{t.newChat}</PrimaryButton>
        <ChatHistory onOpen={onOpen} />
      </Shell>
      );
}

      // ---------------------------------------------------------------------------
      // 5. MIC PERMISSION ERROR
      // ---------------------------------------------------------------------------

      const MIC_COPY: Record<MicError, {title: string; body: string; how: string[] }> = {
        denied: {
        title: 'Microphone is blocked',
      body: 'The browser is not allowing the microphone. Nova needs it to hear you.',
      how: ['Click the lock icon in the address bar', 'Set Microphone to Allow', 'Reload this page'],
  },
      notfound: {
        title: 'No microphone found',
      body: 'This device does not seem to have a microphone.',
      how: ['Connect a headset or mic', 'Check the input device in system settings', 'Reload'],
  },
      other: {
        title: 'Could not open the microphone',
      body: 'Another app may be using it.',
      how: ['Close Meet / Zoom and similar apps', 'Reload the browser', 'Try again'],
  },
};

      function MicErrorScreen({kind, onRetry}: {kind: MicError; onRetry: () => void }) {
  const copy = MIC_COPY[kind];
      return (
      <Shell>
        <div
          className="mb-5 flex size-14 items-center justify-center rounded-full text-2xl"
          style={{ background: `${C.rose}1A` }}
        >
          🎤
        </div>
        <h2 className="text-center text-[21px] font-bold" style={{ color: C.rose }}>
          {copy.title}
        </h2>
        <p
          className="mt-2 max-w-[16rem] text-center text-[14px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          {copy.body}
        </p>

        <div
          className="mt-6 w-full rounded-2xl p-4"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <p
            className="mb-3 font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: C.inkSoft }}
          >
            How to fix
          </p>
          <ol className="flex flex-col gap-2.5">
            {copy.how.map((step, i) => (
              <li key={i} className="flex gap-3 text-[14px]" style={{ color: C.ink }}>
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white"
                  style={{ background: C.clay }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 w-full">
          <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
        </div>
      </Shell>
      );
}

      // ---------------------------------------------------------------------------
      // State machine
      // ---------------------------------------------------------------------------

      const FADE = {
        initial: {opacity: 0, y: 6 },
      animate: {opacity: 1, y: 0 },
      exit: {opacity: 0, y: -6 },
      transition: {duration: 0.26 },
};

      /** Language dropdown. Changing it re-labels the UI and tells the teacher to switch. */
      function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const {lang, setLang} = useContext(LangContext);
      const t = useT();

      if (compact) {
        return (
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-all shadow-2xs">
            <GlobeIcon size={14} weight="bold" className="text-zinc-400 shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent text-xs font-semibold text-zinc-200 outline-none cursor-pointer pr-1"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        );
      }

      return (
      <label className="flex w-full items-center gap-2 text-[12px] text-zinc-400">
        <span className="font-mono tracking-[0.14em] uppercase text-zinc-500">{t.language}</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold outline-none bg-zinc-900 border border-zinc-800 text-white"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
              {l.label}
            </option>
          ))}
        </select>
      </label>
      );
}

      export function NovaView() {
  const [lang, setLangState] = useState<Lang>('en');
        const room = useMaybeRoomContext();
  useEffect(() => setLangState(readLangCookie()), []);
        const setLang = useCallback(
    (l: Lang) => {
          setLangState(l);
        writeLangCookie(l);
        // Mid-class switch: tell whoever is teaching to change language now.
        room?.localParticipant
        .sendText(JSON.stringify({type: 'language', lang: l }), {topic: 'nova-board-student' })
        .catch(() => { });
    },
        [room]
        );
        return (
        <LangContext.Provider value={{ lang, setLang }}>
          <NovaViewInner />
        </LangContext.Provider>
        );
}

        function NovaViewInner() {
  const session = useSessionContext();
        const liveAgent = useAgent();
        const {connectionState, isConnected, start, end} = session;
        const {messages} = useSessionMessages(session);

        const [micError, setMicError] = useState<MicError | null>(null);
        const [choosingTopic, setChoosingTopic] = useState(false);
        const [initialTopic, setInitialTopic] = useState<string | null>(null);
        const [connectionError, setConnectionError] = useState<string | null>(null);
        const starting = useRef(false);
        const [hasEnded, setHasEnded] = useState(false);
        const [turns, setTurns] = useState(0);
        const [canvas, setCanvas] = useState<CanvasPayload[]>([]);
        // Day 9: which agent currently holds the conversation. The backend pushes an
        // 'agent' frame on every handoff, so the UI changes with the voice.
        const [handoffs, setHandoffs] = useState<
    { id: string; from: string; to: string; reason: string; at: number }[]
  >([]);
        const [agentId, setAgentId] = useState<{
    id: string;
        name: string;
        role: string;
        tint: string;
        lang: string;
  }>({id: 'nova', name: 'Arex', role: 'Teacher', tint: C.clay, lang: 'English' });
        const wasConnected = useRef(false);
  const [chatId, setChatId] = useState(() => `c${Date.now()}`);
        const [resume, setResume] = useState<Chat | null>(null);
        const goingHome = useRef(false);
        // "New chat" mid-class: end this session, then go straight into a fresh one.
        const restarting = useRef(false);

  // The agent pushes code and flowcharts here over the data channel while it
  // talks. Anything unparseable is dropped rather than crashing the view.
  useDataChannel('nova-canvas', (msg) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload)) as CanvasPayload;
        if (payload.kind === 'agent') {
        // Record why the conversation moved, so the student can see it rather
        // than wondering why a different voice is suddenly talking.
        if (payload.from && payload.from !== payload.id) {
          setHandoffs((prev) => [
            ...prev,
            {
              id: `${payload.from}-${payload.id}-${prev.length}`,
              from: payload.from!,
              to: payload.id,
              reason: payload.reason ?? '',
              at: Date.now(),
            },
          ]);
        }
        setAgentId({
          id: payload.id,
        name: payload.name,
        role: payload.role,
        tint: payload.tint,
        lang: payload.lang,
        });
        return;
      }
      // Cards accumulate so a flowchart and its code stay on screen together.
      setCanvas((prev) => (payload.kind === 'clear' ? [] : [...prev, payload]));
    } catch {
          /* ignore malformed frames */
        }
  });

  // Remember the transcript length before teardown — messages are cleared on
  // disconnect, so the ended screen would otherwise always read zero.
  useEffect(() => {
    if (isConnected) {
          wasConnected.current = true;
        setTurns(messages.length);
    } else if (wasConnected.current) {
          wasConnected.current = false;
        if (restarting.current) {
          restarting.current = false;
        void handleStartRef.current();
      } else if (goingHome.current) {
          goingHome.current = false; // straight back to the start screen
      } else {
          setHasEnded(true);
      }
    }
  }, [isConnected, messages.length]);

        // Start a class: a brand-new chat, or (with `chat`) continue an old one.
        const startClass = useCallback(
    async (chat: Chat | null) => {
      if (starting.current) return;
        starting.current = true;
        setMicError(null);
        setConnectionError(null);
        const err = await requestMic();
        if (err) {
          setMicError(err);
        starting.current = false;
        return;
      }
        setHasEnded(false);
        setInitialTopic(null);
        setChoosingTopic(!chat);
        setResume(chat);
        setChatId(chat ? chat.id : `c${Date.now()}`);
        // The token route reads this to tell the agent to wait for the history.
        document.cookie = `nova_resume=${chat ? 1 : 0}; path=/; max-age=60; samesite=lax`;
        document.cookie = `nova_onboarding=${chat ? 0 : 1}; path=/; max-age=60; samesite=lax`;
        setCanvas([]);
        setHandoffs([]);
        setAgentId({
          id: 'nova',
        name: 'Arex',
        role: 'Teacher',
        tint: C.clay,
        lang: 'English',
      });
        try {
          await start({
            tracks: {
              microphone: {
                enabled: true,
                publishOptions: {
                  preConnectBuffer: true,
                  stopMicTrackOnMute: true,
                },
              },
            },
          });
      } catch {
          setConnectionError('Could not join the classroom. Please try again.');
      } finally {
          starting.current = false;
      }
    },
        [start]
        );
  const handleStart = useCallback(() => startClass(null), [startClass]);
  const handleContinue = useCallback((chat: Chat) => startClass(chat), [startClass]);

        const handleStartRef = useRef(handleStart);
        handleStartRef.current = handleStart;

  const handleEnd = useCallback(async () => {
          await end();
  }, [end]);

  const handleHome = useCallback(async () => {
          goingHome.current = true;
        setChoosingTopic(false);
        setInitialTopic(null);
        setConnectionError(null);
        await end();
  }, [end]);

  const handleTopicError = useCallback(() => {
          setInitialTopic(null);
        setChoosingTopic(true);
        setConnectionError('Could not send your topic. Please reconnect and try again.');
  }, []);

  const retryConnection = useCallback(async () => {
          goingHome.current = true;
        await end();
        await startClass(null);
  }, [end, startClass]);

  useEffect(() => {
    if (!choosingTopic) return;
    const timer = setTimeout(() => setConnectionError('This classroom has been waiting a while. Reconnect to start your lesson.'), 150_000);
    return () => clearTimeout(timer);
  }, [choosingTopic]);

  const handleNewChat = useCallback(async () => {
          restarting.current = true;
        await end();
  }, [end]);

        let screen: Screen = 'ready';
        if (micError) screen = 'mic-error';
        else if (choosingTopic) screen = 'topic';
        else if (isConnected) screen = 'live';
        else if (connectionState === ConnectionState.Connecting) screen = 'connecting';
        else if (hasEnded) screen = 'ended';

        return (
        <AnimatePresence mode="wait">
          <motion.div key={screen} {...FADE}>
            {screen === 'ready' && <ReadyScreen onStart={handleStart} onOpen={handleContinue} />}
            {screen === 'topic' && <TopicPicker connected={isConnected && liveAgent.isConnected} error={connectionError}
              onChoose={(topic) => { setInitialTopic(topic); setChoosingTopic(false); }}
              onCancel={handleHome} onRetry={retryConnection} />}
            {screen === 'connecting' && <ConnectingScreen />}
            {screen === 'live' && (
              <LiveScreen
                chatId={chatId}
                initialTopic={initialTopic}
                onTopicError={handleTopicError}
                resume={resume}
                onHome={handleHome}
                onNewChat={handleNewChat}
                onEnd={handleEnd}
                canvas={canvas}
                agent={agentId}
                handoffs={handoffs}
              />
            )}
            {screen === 'ended' && (
              <EndedScreen turns={turns} onRestart={handleStart} onOpen={handleContinue} />
            )}
            {screen === 'mic-error' && <MicErrorScreen kind={micError!} onRetry={handleStart} />}
          </motion.div>
        </AnimatePresence>
        );
}
