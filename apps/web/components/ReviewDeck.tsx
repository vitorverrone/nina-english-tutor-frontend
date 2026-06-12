'use client';

import { useRef, useState } from 'react';
import type { ReviewCard } from '@english-teacher/shared';
import { gradeReview, gradeFillIn } from '@/lib/actions';
import { useTranslations } from 'next-intl';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Trophy } from 'lucide-react';

const FILL_IN_FALLBACK_CATEGORIES = new Set(['word_order', 'vocab']);

function isFillInCard(card: ReviewCard): boolean {
    return card.itemType === 'error' && !!card.error && !FILL_IN_FALLBACK_CATEGORIES.has(card.error.category);
}

export function ReviewDeck({ initialCards, initialTotal }: { initialCards: ReviewCard[]; initialTotal: number }) {
    const t = useTranslations('review');
    const [queue, setQueue] = useState<ReviewCard[]>(initialCards);
    const [revealed, setRevealed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [completed, setCompleted] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fillInAttempt, setFillInAttempt] = useState('');
    const [fillInResult, setFillInResult] = useState<{ quality: number } | null>(null);
    const fillInInputRef = useRef<HTMLInputElement>(null);

    const grades: { quality: number; label: string; sublabel: string; type: 'red' | 'amber' | 'green' | 'sky' }[] = [
        {
            quality: 1,
            label: t('grades.forgot.label'),
            sublabel: t('grades.forgot.sublabel'),
            type: 'red',
        },
        {
            quality: 3,
            label: t('grades.hard.label'),
            sublabel: t('grades.hard.sublabel'),
            type: 'amber',
        },
        {
            quality: 4,
            label: t('grades.good.label'),
            sublabel: t('grades.good.sublabel'),
            type: 'green',
        },
        {
            quality: 5,
            label: t('grades.easy.label'),
            sublabel: t('grades.easy.sublabel'),
            type: 'sky',
        },
    ];

    const total = initialTotal;
    const current = queue[0];

    const advanceQueue = () => {
        setQueue((q) => q.slice(1));
        setCompleted((n) => n + 1);
        setRevealed(false);
        setFillInAttempt('');
        setFillInResult(null);
    };

    const checkFillIn = async () => {
        if (busy || !current) return;
        setBusy(true);
        setError(null);
        try {
            const res = await gradeFillIn(current.id, fillInAttempt);
            setFillInResult({ quality: res.quality });
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (!current) {
        return total === 0 ? (
            <Card className="text-center p-6 gap-3">
                <p className="font-serif flex gap-3 items-center justify-center text-3xl-clamp text-dark-indigo">
                    {t('noCardsTitle')}
                </p>
                <p className="text-sm-clamp text-cadet-blue">{t('noCardsText')}</p>
            </Card>
        ) : (
            <Card type="green" className="text-center p-6 gap-3">
                <p className="font-serif flex gap-3 items-center justify-center text-3xl-clamp">
                    <Trophy size={30} /> {t('allDoneTitle')}
                </p>
                <p className="text-sm-clamp">{t('allDoneText', { n: completed })}</p>
            </Card>
        );
    }

    const grade = async (quality: number) => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            await gradeReview(current.id, { quality });
            advanceQueue();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="flex justify-end">
                <Badge mode="sky">
                    {t('progress', { done: completed + 1, total: total })}
                </Badge>
            </div>

            <Card className="p-5 mb-5">
                <div className="border-b border-pale-blue pb-4 mb-3 flex items-center justify-between flex-wrap gap-2">
                    <Badge mode={current.itemType === 'vocab' && current.vocab ? 'warn' : 'danger'}>
                        {current.itemType === 'error' && current.error ? (
                            t('errorEyebrow', { category: current.error.category })
                        ) : (
                            t('vocabEyebrow')
                        )}
                    </Badge>
                </div>
                {current.itemType === 'vocab' && current.vocab && (
                    <>
                        <div className="mb-3 text-center">
                            <p className="text-sm-clamp mb-2 font-semibold">{t('vocabHint')}</p>
                            <h3 className="font-serif text-3xl-clamp text-dark-indigo">"{current.vocab.termEn}"</h3>
                        </div>

                        {revealed && (
                            <div className="border-t border-pale-blue pt-5 mt-3">
                                <p className="text-xs font-bold text-cadet-blue">{t('translationLabel')}</p>
                                <p className="text-2xl-clamp text-dark-indigo">{current.vocab.translationL1}</p>

                                {current.vocab.example && (
                                    <div className="bg-blue-grey border border-pale-blue rounded-xl px-4 py-3 mt-3 flex flex-col gap-1">
                                        <p className="text-xs font-bold text-cadet-blue">{t('exampleLabel')}</p>
                                        <div className="text-sm-clamp text-dark-indigo">{current.vocab.example}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {current.itemType === 'error' && current.error && isFillInCard(current) && (
                    <>
                        <div className="mb-4">
                            <p className="text-sm-clamp mb-2 font-semibold">{t('youWrote')}</p>
                            <p className="font-serif text-2xl-clamp text-dark-indigo">"{current.error.studentOutput}"</p>
                        </div>

                        {!fillInResult ? (
                            <div className="border-t border-pale-blue pt-4 flex flex-col gap-3">
                                <label htmlFor="fill-in-input" className="text-sm-clamp font-semibold text-dark-indigo">{t('fillInPrompt')}</label>
                                <input
                                    ref={fillInInputRef}
                                    id="fill-in-input"
                                    type="text"
                                    value={fillInAttempt}
                                    onChange={(e) => setFillInAttempt(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && fillInAttempt.trim()) checkFillIn(); }}
                                    placeholder={t('fillInPlaceholder')}
                                    className="border border-pale-blue bg-alice-blue rounded-xl px-3 py-3 text-base text-dark-indigo placeholder:text-cadet-blue focus:outline-none focus:ring-2 focus:ring-primary/40 w-full disabled:opacity-50"
                                    disabled={busy}
                                />
                            </div>
                        ) : (
                            <div className="border-t border-pale-blue pt-4 flex flex-col gap-3">
                                <p className={`text-sm-clamp font-bold ${fillInResult.quality === 5 ? 'text-emerald-600' : fillInResult.quality === 3 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {fillInResult.quality === 5 ? t('fillInResultExact') : fillInResult.quality === 3 ? t('fillInResultPartial') : t('fillInResultWrong')}
                                </p>
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-600 mb-1">{t('correctForm')}</p>
                                    <p className="font-serif text-xl !text-emerald-700">"{current.error.correction}"</p>
                                </div>
                                {current.error.ruleHintL1 && (
                                    <div className="bg-blue-grey border border-pale-blue rounded-xl px-4 py-3 flex flex-col gap-1">
                                        <p className="text-xs uppercase font-bold text-cadet-blue">{t('ruleLabel')}</p>
                                        <div className="text-sm-clamp text-dark-indigo">{current.error.ruleHintL1}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {current.itemType === 'error' && current.error && !isFillInCard(current) && (
                    <>
                        <div className="mb-3 text-center">
                            <p className="text-sm-clamp mb-2 font-semibold">{t('youWrote')}</p>
                            <h3 className="font-serif text-3xl-clamp text-dark-indigo">"{current.error.studentOutput}"</h3>
                        </div>

                        {revealed && (
                            <div className="border-t border-pale-blue pt-5 mt-3">
                                <p className="text-xs font-bold uppercase text-emerald-600 mb-2">{t('correctForm')}</p>
                                <p className="font-serif text-2xl-clamp !text-emerald-700">"{current.error.correction}"</p>

                                {current.error.ruleHintL1 && (
                                    <div className="bg-blue-grey border border-pale-blue rounded-xl px-4 py-3 mt-3 flex flex-col gap-1">
                                        <p className="text-xs uppercase font-bold text-cadet-blue">{t('ruleLabel')}</p>
                                        <div className="text-sm-clamp text-dark-indigo">{current.error.ruleHintL1}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Card>

            {error && <Card type="red" className="text-sm-clamp">{error}</Card>}

            {isFillInCard(current) ? (
                fillInResult ? (
                    <Button onClick={advanceQueue} className="m-auto" disabled={busy}>
                        {t('fillInNext')}
                    </Button>
                ) : (
                    <Button
                        onClick={checkFillIn}
                        className="m-auto"
                        disabled={busy || !fillInAttempt.trim()}
                    >
                        {t('fillInCheck')}
                    </Button>
                )
            ) : !revealed ? (
                <Button onClick={() => setRevealed(true)}>
                    {t('reveal')}
                </Button>
            ) : (
                <>
                    <p className="text-center text-sm-clamp text-cadet-blue">{t('howDidYouDo')}</p>
                    <div className="grid sm:grid-cols-4 xs:grid-cols-2 gap-3">
                        {grades.map((g) => (
                            <Card
                                type={g.type}
                                key={g.quality}
                                onClick={() => grade(g.quality)}
                                link={true}
                                className="text-center gap-1 cursor-pointer"
                            >
                                <span className="text-lg font-bold">{g.label}</span>
                                <span className="text-xs">{g.sublabel}</span>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
