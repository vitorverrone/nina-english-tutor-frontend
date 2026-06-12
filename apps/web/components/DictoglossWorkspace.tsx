'use client';

import { useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { DictoglossDailySession, DictoglossEvaluation } from '@english-teacher/shared';

type GeneratedSession = Extract<DictoglossDailySession, { generated: true }>;

import { submitDictogloss } from '@/lib/actions';
import { Card } from './Card';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { useTranslations } from 'next-intl';

function tokenClass(kind: 'match' | 'missing' | 'extra'): string {
    if (kind === 'match') return 'bg-emerald-100 text-emerald-900';
    if (kind === 'missing') return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
}

export function DictoglossWorkspace({ session }: { session: GeneratedSession }) {
    const t = useTranslations('dictogloss');
    const [answers, setAnswers] = useState<string[]>(() => session.sentences.map(() => ''));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DictoglossEvaluation | null>(null);

    const canSubmit = useMemo(
        () => answers.some((a) => a.trim().length > 0),
        [answers],
    );

    const setAnswer = (idx: number, value: string) => {
        setAnswers((prev) => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    const speakSentence = (text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
    };

    const playAll = async () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        for (const sentence of session.sentences) {
            await new Promise<void>((resolve) => {
                const utter = new SpeechSynthesisUtterance(sentence.text);
                utter.lang = 'en-US';
                utter.rate = 0.95;
                utter.onend = () => setTimeout(resolve, 300);
                window.speechSynthesis.speak(utter);
            });
        }
    };

    const submit = async () => {
        if (!canSubmit || busy) return;
        setBusy(true);
        setError(null);
        try {
            const evalResult = await submitDictogloss({
                sessionKey: session.sessionKey,
                answers: answers.map((a) => a.trim()),
            });
            setResult(evalResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('genericError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3">
                <p className="text-sm-clamp text-cadet-blue">{t('instructions')}</p>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={playAll} mode="logout">
                        <Volume2 size={16} /> {t('playAll')}
                    </Button>
                </div>
            </Card>

            <Card className="flex flex-col gap-6">
                {session.sentences.map((sentence, idx) => (
                    <div key={sentence.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm-clamp font-semibold text-dark-indigo">{t('sentence', { n: idx + 1 })}</p>
                            <Button mode="logout" onClick={() => speakSentence(sentence.text)}>
                                <Volume2 size={16} /> {t('listenAgain')}
                            </Button>
                        </div>
                        <TextArea
                            label=""
                            name={`dictogloss-${idx}`}
                            value={answers[idx]}
                            onChange={(e) => setAnswer(idx, e.target.value)}
                            rows={2}
                            placeholder={t('answerPlaceholder')}
                        />
                    </div>
                ))}

                {error && <Card type="red" className="text-sm-clamp">{error}</Card>}

                <Button onClick={submit} disabled={!canSubmit || busy} loading={busy} loadingText={t('checking')} className="self-end">
                    {t('submit')}
                </Button>
            </Card>

            {result && (
                <Card className="flex flex-col gap-4">
                    <p className="font-serif text-2xl-clamp text-dark-indigo">{t('score', { score: result.overallAccuracy })}</p>
                    <div className="flex flex-col gap-4">
                        {result.results.map((item, idx) => (
                            <div key={item.sentenceId} className="flex flex-col gap-2 rounded-xl bg-blue-grey border border-pale-blue p-3">
                                <p className="text-sm-clamp font-semibold text-dark-indigo">
                                    {t('sentence', { n: idx + 1 })} · {item.accuracy}%
                                </p>
                                <p className="text-xs text-cadet-blue">{t('referenceLabel')}: {item.expected}</p>
                                <div className="flex flex-wrap gap-1">
                                    {item.diff.map((token, tokenIdx) => (
                                        <span key={`${item.sentenceId}-${tokenIdx}`} className={`px-1.5 py-0.5 rounded text-xs ${tokenClass(token.kind)}`}>
                                            {token.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
