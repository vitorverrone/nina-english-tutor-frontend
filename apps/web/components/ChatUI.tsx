'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef, useState } from "react";

import { ChatMessage, UserGoal } from "@english-teacher/shared";
import { Card } from "./Card";
import { MicButton } from "./MicButton";
import { Input } from "./Input";
import { TextArea } from "./TextArea";
import { Button } from "./Button";
import { sendMessageStream } from '@/lib/api';
import { useTranslations } from 'next-intl';

type SegmentType = 'text' | 'in_character' | 'coach' | 'cultural' | 'drill';

interface MessageSegment {
    type: SegmentType;
    content: string;
}

function parseSegments(raw: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    const blockRe = /<(in_character|coach|cultural|drill)>([\s\S]*?)<\/\1>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRe.exec(raw)) !== null) {
        const before = raw.slice(lastIndex, match.index).trim();
        if (before) segments.push({ type: 'text', content: before });
        segments.push({ type: match[1] as SegmentType, content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }

    const after = raw.slice(lastIndex).trim();
    if (after) segments.push({ type: 'text', content: after });

    return segments.length > 0 ? segments : [{ type: 'text', content: raw }];
}

function parseDrillItems(content: string): { header: string; items: string[] } {
    const lines = content.split('\n');
    const items: string[] = [];
    const headerLines: string[] = [];

    for (const line of lines) {
        if (/^\d+[.)]\s+/.test(line.trim())) {
            items.push(line.trim());
        } else if (line.trim()) {
            headerLines.push(line.trim());
        }
    }

    if (items.length === 0) {
        return { header: '', items: [content.trim()] };
    }
    return { header: headerLines.join('\n'), items };
}

function TextBlock({ content, label }: { content: string; label?: string }) {
    return (
        <div className={`flex flex-col gap-2 ${label && 'mt-2 pt-2 border-t-2' || ''}`}>
            {label && <div className="text-xs text-cadet-blue mb-1 font-medium">{label}</div>}
            <div className={`${label && 'italic' || ''} flex flex-col gap-1`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>
        </div>
    );
}

function ExerciseBlock({ content, label, sendLabel, placeholder, answers, onAnswer, onSend }: { content: string; label: string; sendLabel: string; placeholder: string; answers: string[]; onAnswer: (idx: number, val: string) => void; onSend: (text: string) => void }) {
    const { header, items } = parseDrillItems(content);

    const handleSend = () => {
        const formatted = items.map((item, idx) => `${idx + 1}. ${answers[idx] ?? ''}`).join(' | ');
        onSend(formatted);
    };

    return (
        <Card type="sky" className="my-3">
            <div className="text-xs mb-2 font-bold">{label}</div>
            {header && <p className="text-sm-clamp text-sky-800 mb-3">{header}</p>}
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                        <Input
                            name={`drill-answer-${idx}`}
                            id={`drill-answer-${idx}`}
                            label={item}
                            value={answers[idx] ?? ''}
                            onChange={(e) => onAnswer(idx, e.target.value)}
                            placeholder={placeholder}
                        />
                    </div>
                ))}
            </div>
            <Button onClick={handleSend} mode="green" className="self-end">
                {sendLabel}
            </Button>
        </Card>
    );
}

export function ChatUI({ topicId, initialHistory, sessionGoal }: { topicId: string; initialHistory: ChatMessage[]; sessionGoal?: UserGoal | null }) {
    const t = useTranslations('chat');
    const [history, setHistory] = useState<ChatMessage[]>(initialHistory);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');
    const [streamingContent, setStreamingContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [drillAnswers, setDrillAnswers] = useState<Record<string, string[]>>({});
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const accumulatedRef = useRef('');

    const visibleHistory = history.filter((m) => !(m.role === 'user' && m.content.startsWith('[system:')));
    const isEmpty = visibleHistory.length === 0;

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [history, loading, streamingContent]);

    const submit = async (overrideMessage?: string) => {
        const message = (overrideMessage ?? input).trim();
        if (!message || loading || completed) return;
        setLoading(true);
        setStreamingContent(null);
        setError(null);
        accumulatedRef.current = '';
        setHistory((h) => [
            ...h,
            {
                id: `local-${Date.now()}`,
                role: 'user',
                content: message,
                createdAt: new Date().toISOString(),
            },
        ]);

        try {
            for await (const event of sendMessageStream(topicId, message, sessionGoal)) {
                if (event.type === 'token') {
                    accumulatedRef.current += event.text;
                    setStreamingContent(accumulatedRef.current);
                } else if (event.type === 'done') {
                    const finalContent = accumulatedRef.current;
                    setStreamingContent(null);
                    if (event.topicCompleted) setCompleted(true);
                    setHistory((h) => [
                        ...h,
                        {
                            id: `stream-${Date.now()}`,
                            role: 'assistant',
                            content: finalContent,
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                } else if (event.type === 'error') {
                    setError(event.message);
                    setStreamingContent(null);
                }
            }
        } catch (e) {
            setError((e as Error).message);
            setStreamingContent(null);
        } finally {
            setLoading(false);
            setInput('');
        }
    };

    const handleDrillAnswer = (messageId: string, idx: number, val: string) => {
        setDrillAnswers((prev) => {
            const arr = [...(prev[messageId] ?? [])];
            arr[idx] = val;
            return { ...prev, [messageId]: arr };
        });
    };

    const handleSendDrill = (text: string) => {
        setInput(text);
        submit(text);
    };

    const stopListening = () => {
        setIsListening(false);
        submit();
    }

    return (
        <>
            <div ref={scrollRef} className="md:bg-white md:border border-pale-blue rounded-2xl p-4 md:p-5 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto" aria-live="polite" aria-atomic="false">
                {isEmpty && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm-clamp text-cadet-blue">{t('preparing')}</p>
                    </div>
                )}
                {visibleHistory.map((m) => {
                    const segments = m.role === 'assistant' ? parseSegments(m.content) : null;
                    return (
                        <Card key={m.id} type={m.role === 'user' ? 'chat-you' : 'chat-nina'} className={`max-w-[80%] md:max-w-[65ch] ${m.role === 'user' && 'self-end'}`}>
                            <p className="font-bold text-xs">{m.role === 'user' ? t('you') : t('nina')}</p>
                            <div className="text-sm-clamp">
                                {m.role === 'user' || !segments ? (
                                    <div className=" max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div>
                                        {segments.map((seg, si) => {
                                            if (seg.type === 'drill') {
                                                return (
                                                    <ExerciseBlock
                                                        key={si}
                                                        content={seg.content}
                                                        label={t('drillLabel')}
                                                        sendLabel={t('drillSend')}
                                                        placeholder={t('drillPlaceholder')}
                                                        answers={drillAnswers[m.id] ?? []}
                                                        onAnswer={(idx, val) => handleDrillAnswer(m.id, idx, val)}
                                                        onSend={handleSendDrill}
                                                    />
                                                );
                                            } else {
                                                const label = seg.type !== 'text' ? t(`${seg.type}Label`) : '';
                                                return <TextBlock key={si} content={seg.content} label={label} />;
                                            }
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}

                {streamingContent !== null && (
                    <Card type="chat-nina" className="max-w-[80%] md:max-w-[65ch]">
                        <p className="font-bold text-xs">{t('nina')}</p>
                        <ReactMarkdown className="text-sm-clamp" remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                    </Card>
                )}

                {loading && streamingContent === null && (
                    <div className="flex items-center gap-2" role="status">
                        <span className="sr-only">{t('typing')}</span>
                        <span aria-hidden="true" className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue">{t('nina')}</span>
                        <span aria-hidden="true" className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-pulse [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-pulse [animation-delay:200ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-pulse [animation-delay:400ms]" />
                        </span>
                    </div>
                )}

                {error && (
                    <Card type="red" className="text-sm-clamp">
                        {error}
                    </Card>
                )}

                {completed && (
                    <Card type="green" className="mt-2">
                        <p className="font-serif text-xl">{t('completedTitle')}</p>
                        <p className="text-sm-clamp mt-1">{t('completedBody')}</p>
                    </Card>
                )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2 items-center m-0 bg-white md:bg-transparent p-4 md:p-0">
                <textarea
                    className="flex-1 bg-sand md:bg-white border border-pale-blue rounded-full py-3 px-4 text-dark-indigo placeholder:text-cadet-blue transition-all focus:outline-none focus:border-primary focus:shadow-[0_4px_12px_rgba(30,27,75,0.08)] resize-none"
                    placeholder={completed ? t('placeholderCompleted') : t('placeholder')}
                    rows={1}
                    value={input}
                    aria-label={completed ? t('placeholderCompleted') : t('placeholder')}
                    disabled={loading || completed}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />

                <MicButton onTranscript={(text, { final }) => setInput(text)} onStopListening={() => stopListening()} onStartListening={() => setIsListening(true)} className={`md:block  ${(input && !isListening) && 'hidden'} `} />
                <Button type="submit" className={`py-3 px-4 sm:px-8 ${(!input || isListening) ? 'hidden md:block' : ''}`}>{t('send')}</Button>
            </form>
        </>
    )
}
