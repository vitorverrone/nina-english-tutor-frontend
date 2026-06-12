'use client';

import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionResultEventLike {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            length: number;
            [index: number]: { transcript: string };
        };
    };
}

interface SpeechRecognitionLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

function getRecognitionCtor(): RecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const FATAL_ERRORS = new Set(['not-allowed', 'audio-capture', 'service-not-allowed']);

export function MicButton({ onTranscript, onStartListening, disabled, onStopListening, className }: { onTranscript: (text: string, opts: { final: boolean }) => void, onStartListening?: () => void, disabled?: boolean, onStopListening?: () => void, className?: string }) {
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const shouldKeepListeningRef = useRef(false);
    const finalTextRef = useRef('');
    const lastResultRef = useRef('');

    useEffect(() => {
        setSupported(getRecognitionCtor() !== null);
        return () => {
            shouldKeepListeningRef.current = false;
            recognitionRef.current?.abort?.();
            recognitionRef.current = null;
        };
    }, []);

    if (!supported) return null;

    const startRecognition = () => {
        const Ctor = getRecognitionCtor();
        if (!Ctor) return;
        const rec = new Ctor();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const r = event.results[i];
                const chunk = r[0]?.transcript ?? '';
                if (r.isFinal) finalTextRef.current += chunk;
                else interim += chunk;
            }
            const combined = (finalTextRef.current + interim).trim();
            lastResultRef.current = combined;
            if (combined) onTranscript(combined, { final: false });
        };

        rec.onend = () => {
            recognitionRef.current = null;
            if (shouldKeepListeningRef.current) {
                setTimeout(() => {
                    if (!shouldKeepListeningRef.current) return;
                    try {
                        startRecognition();
                    } catch (e) {
                        shouldKeepListeningRef.current = false;
                        setListening(false);
                        setError((e as Error).message);
                    }
                }, 50);
                return;
            }
            setListening(false);
            const clean = (finalTextRef.current.trim() || lastResultRef.current.trim());
            if (clean) onTranscript(clean, { final: true });
        };

        rec.onerror = (e) => {
            const err = e.error ?? 'speech recognition error';
            if (FATAL_ERRORS.has(err)) {
                shouldKeepListeningRef.current = false;
                setError(err);
            } else if (err !== 'no-speech' && err !== 'aborted') {
                setError(err);
            }
        };

        recognitionRef.current = rec;
        rec.start();
    };

    const start = () => {
        setError(null);
        finalTextRef.current = '';
        lastResultRef.current = '';
        shouldKeepListeningRef.current = true;
        onStartListening?.();

        try {
            startRecognition();
            setListening(true);
        } catch (e) {
            shouldKeepListeningRef.current = false;
            setError((e as Error).message);
        }
    };

    const stop = () => {
        shouldKeepListeningRef.current = false;
        recognitionRef.current?.stop?.();
        setListening(false);
        if (onStopListening) onStopListening();
    };

    return (
        <button
            type="button"
            className={cn("relative flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className)}
            onClick={listening ? stop : start}
            disabled={disabled}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
            aria-pressed={listening}
        >
            {listening && (
                <>
                    <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-[ping_2s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full bg-primary opacity-30 animate-[ping_2s_linear_infinite_500ms]" />
                </>
            )}

            <div
                className={cn("relative z-10 p-3 rounded-full border-2 transition-all duration-300", listening ? "bg-primary border-primary/80 text-white shadow-lg" : "bg-white border-sand text-silver-blue hover:bg-alice-blue")}
            >
                <Mic size={22} />
            </div>
        </button>
    );
}
