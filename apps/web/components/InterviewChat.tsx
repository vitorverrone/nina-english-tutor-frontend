'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, Circle, Send, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { StartInterviewResponse } from '@english-teacher/shared';
import { sendInterviewMessage } from '@/lib/actions';
import { ApiError } from '@/lib/api';
import { MicButton } from './MicButton';
import { Badge } from './Badge';
import { Card } from './Card';
import { TextArea } from './TextArea';
import { Button } from './Button';

const PHASE_LABELS = ['Warm-up', 'Core Interview', 'Closing'];

function estimatePhase(turnIndex: number): number {
    if (turnIndex < 3) return 0;
    if (turnIndex < 10) return 1;
    return 2;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Props {
    session: StartInterviewResponse;
    onComplete: (sessionId: string) => void;
}

export function InterviewChat({ session, onComplete }: Props) {
    const tErrors = useTranslations('errors');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: session.firstMessage },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [turnIndex, setTurnIndex] = useState(1);
    const [error, setError] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoSpokenRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const lastIdx = messages.length - 1;
        const last = messages[lastIdx];
        if (last?.role === 'assistant' && !autoSpokenRef.current.has(lastIdx) && typeof window !== 'undefined' &&
            'speechSynthesis' in window) {
            autoSpokenRef.current.add(lastIdx);

            const speak = () => {
                const utter = new SpeechSynthesisUtterance(last.content);
                utter.lang = 'en-US';
                utter.rate = 0.95;
                const voices = window.speechSynthesis.getVoices();
                const enVoice =
                    voices.find((v) => v.lang === 'en-US' && v.localService) ??
                    voices.find((v) => v.lang === 'en-US') ??
                    voices.find((v) => v.lang.startsWith('en'));
                if (enVoice) utter.voice = enVoice;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utter);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                speak();
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    window.speechSynthesis.onvoiceschanged = null;
                    speak();
                };
            }
        }
    }, [messages]);

    const submitMessageRef = useRef<(text: string) => Promise<void>>(async () => { });

    const submitMessage = useCallback(async (text: string) => {
        if (!text.trim() || sending) return;
        setError('');
        setSending(true);

        const userMsg: Message = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);

        try {
            const res = await sendInterviewMessage(session.sessionId, text);
            setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
            setTurnIndex((t) => t + 1);

            if (res.interviewComplete) {
                window.speechSynthesis?.cancel();
                setTimeout(() => onComplete(session.sessionId), 1800);
            }
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : tErrors('UNKNOWN_ERROR'));
            setMessages((prev) => prev.filter((m) => m !== userMsg));
        } finally {
            setSending(false);
        }
    }, [sending, session.sessionId, onComplete]);

    submitMessageRef.current = submitMessage;

    const handleTranscript = useCallback((text: string, opts: { final: boolean }) => {
        setInput(text);
        if (opts.final && text.trim()) {
            setInput('');
            submitMessageRef.current(text.trim());
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                const text = input.trim();
                setInput('');
                submitMessage(text);
            }
        }
    };

    const submitListening = () => {
        const text = input.trim();
        if (text) {
            setInput('');
            submitMessage(text);
        }
    }

    const phase = estimatePhase(turnIndex);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap gap-2">
                <Badge mode="sky" className="cursor-default py-2 gap-2 text-xs">
                    <Circle size={8} fill="currentColor" />
                    Phase {phase + 1} of {PHASE_LABELS.length} - {PHASE_LABELS[phase]}
                </Badge>

                <Badge mode="danger" className="cursor-pointer py-2 gap-2 text-xs"
                    onClick={() => {
                        if (confirm('End the interview now? You\'ll see your debrief.')) {
                            submitMessage('end interview');
                        }
                    }}
                >
                    <Square size={14} />
                    End Interview
                </Badge>
            </div>
            <Card className="p-5 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'self-end' : 'justify-start'}`}>
                        <p className={`text-xs text-silver-blue font-bold uppercase ${msg.role === 'user' && 'text-right'}`}>
                            {msg.role === 'assistant' ? session.companyName : 'You'}
                        </p>
                        <div className={`px-4 py-3 rounded-2xl text-sm-clamp leading-relaxed border ${msg.role === 'user'
                            ? 'bg-blue-50 border-blue-200 text-dark-indigo rounded-tr-sm'
                            : 'bg-white/90 text-dark-indigo border-pale-blue/80 rounded-tl-sm shadow-[0_4px_12px_rgba(30,27,75,0.08)]'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex gap-1 items-center h-4" role="status">
                        <span className="sr-only">Sending…</span>
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
                {error && <Card type="red" className="text-sm-clamp max-w-2xl mx-auto">{error}</Card>}
            </Card>
            <div className="flex flex-col w-full max-w-2xl mx-auto justify-center gap-2 mt-2 items-center">
                {input && (
                    <Badge className="px-2 text-sm-clamp border border-pale-blue text-left italic" onClick={submitListening}>
                        <Activity className="text-primary" size={14} />
                        <span className="text-xs">Listening... "{input}"</span>
                    </Badge>
                )}
                <MicButton
                    onTranscript={handleTranscript}
                    onStartListening={() => window.speechSynthesis?.cancel()}
                    disabled={sending}
                />
                <p className="text-[10px] text-silver-blue">Tap to speak · tap again to send</p>

                <div className="w-full flex gap-2 opacity-60 hover:opacity-100 transition-opacity items-center">
                    <TextArea
                        name="interview_chat_textarea"
                        aria-label="Type your answer"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type if microphone isn't available…"
                        disabled={sending}
                        className="disabled:opacity-50 w-full"
                        style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                    <Button
                        onClick={submitListening}
                        disabled={!input.trim() || sending}
                        aria-label="Send message"
                        className="flex-shrink-0 rounded-full disabled:opacity-30 flex items-center justify-center transition w-10 h-10 p-0"
                    >
                        <Send size={14} aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </>
    );
}
