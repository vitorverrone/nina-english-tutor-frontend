'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import type { InterviewDebrief } from '@english-teacher/shared';
import { fetchInterviewDebrief, saveInterviewVocab } from '@/lib/actions';
import { Card } from './Card';
import { Badge } from './Badge';
import { Activity, BookmarkPlus, BookOpen, Lightbulb, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';

interface Props {
    sessionId: string;
    companyName: string;
    jobRole: string;
}

export function InterviewDebrief({ sessionId, companyName, jobRole }: Props) {
    const t = useTranslations('interview.debrief');
    const [debrief, setDebrief] = useState<InterviewDebrief | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingVocab, setSavingVocab] = useState(false);
    const [vocabSaved, setVocabSaved] = useState(false);

    const loadDebrief = useCallback(() => {
        setLoading(true);
        setError('');
        setDebrief(null);

        let attempts = 0;
        const maxAttempts = 6;
        const poll = async () => {
            try {
                const res = await fetchInterviewDebrief(sessionId);
                const d = res.debrief as unknown as {
                    fluency_notes: string;
                    professional_vocab_used: { term_en: string; how_used: string; better_alternative_en?: string }[];
                    improvement_suggestions: { area: string; tip_l1: string; example_en: string }[];
                    strengths: string[];
                    interview_score: number;
                };
                setDebrief({
                    fluencyNotes: d.fluency_notes,
                    professionalVocabUsed: d.professional_vocab_used.map((v) => ({
                        termEn: v.term_en,
                        howUsed: v.how_used,
                        betterAlternativeEn: v.better_alternative_en,
                    })),
                    improvementSuggestions: d.improvement_suggestions.map((s) => ({
                        area: s.area,
                        tipL1: s.tip_l1,
                        exampleEn: s.example_en,
                    })),
                    strengths: d.strengths,
                    interviewScore: d.interview_score,
                });
                setLoading(false);
            } catch {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 3000);
                } else {
                    setError(t('loadError'));
                    setLoading(false);
                }
            }
        };
        poll();
    }, [sessionId]);

    useEffect(() => {
        loadDebrief();
    }, [loadDebrief]);

    const handleSaveVocab = async () => {
        if (!debrief || vocabSaved) return;
        setSavingVocab(true);
        try {
            const items = debrief.professionalVocabUsed.map((v) => ({
                termEn: v.termEn,
                translationL1: v.betterAlternativeEn ?? v.termEn,
                example: v.howUsed,
            }));
            await saveInterviewVocab({ sessionId, items });
            setVocabSaved(true);
        } catch { } finally {
            setSavingVocab(false);
        }
    };

    const scoreColor = (s: number) => {
        if (s >= 8) return '!text-emerald-600';
        if (s >= 6) return '!text-primary';
        if (s >= 4) return '!text-amber-600';
        return '!text-red-600';
    };

    const scoreBadge = (s: number) => {
        if (s >= 8) return 'green';
        if (s >= 6) return 'sky';
        if (s >= 4) return 'warn';
        return 'danger';
    };

    const scoreLabel = (s: number) => {
        if (s >= 8) return 'Excellent';
        if (s >= 6) return 'Good';
        if (s >= 4) return 'Fair';
        return 'Needs Work';
    };

    if (loading) {
        return (
            <Card className="py-12 flex flex-col items-center gap-4">
                <div aria-hidden="true" className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cadet-blue animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-cadet-blue animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-cadet-blue animate-bounce [animation-delay:300ms]" />
                </div>
                <p className="text-sm-clamp text-cadet-blue">{t('generating')}</p>
            </Card>
        );
    }

    if (error) {
        return <Card type="red" className="text-sm-clamp">{error}</Card>;
    }

    if (!debrief) return null;

    return (
        <div className="flex flex-col gap-4">
            <Card className="m-auto gap-1 text-center">
                <p className={`font-serif text-4xl-clamp ${scoreColor(debrief.interviewScore)}`}>
                    {debrief.interviewScore.toFixed(1)}
                </p>
                <p className="text-cadet-blue text-xs">out of 10</p>
                <Badge mode={scoreBadge(debrief.interviewScore) as 'green' | 'sky' | 'warn' | 'danger'} className="px-2 text-xs">
                    {scoreLabel(debrief.interviewScore)}
                </Badge>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-6 gap-3">
                    <h2 className="font-serif text-2xl-clamp flex gap-2 items-center text-dark-indigo">
                        <span className="bg-alice-blue text-primary rounded-lg p-2">
                            <Activity size={16} />
                        </span>
                        {t('fluencyNotes')}
                    </h2>
                    <p className="text-sm-clamp text-dark-indigo leading-relaxed">{debrief.fluencyNotes}</p>
                </Card>

                {debrief.strengths.length > 0 && (
                    <Card type="green" className="p-6 gap-3">
                        <h2 className="font-serif text-2xl-clamp flex gap-2 items-center">
                            <span className="bg-emerald-100 text-green-600 rounded-lg p-2">
                                <Trophy size={16} />
                            </span>
                            {t('strengths')}
                        </h2>
                        <ul className="space-y-2">
                            {debrief.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm-clamp text-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            {debrief.professionalVocabUsed.length > 0 && (
                <Card className="p-6 gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif text-2xl-clamp flex gap-2 items-center text-dark-indigo">
                            <span className="bg-amber-50 text-amber-600 rounded-lg p-2">
                                <BookOpen size={16} />
                            </span>
                            {t('profVocabulary')}
                        </h2>
                        <p className="text-sm-clamp text-cadet-blue">{debrief.professionalVocabUsed.length} {t('terms')}</p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-pale-blue">
                        {debrief.professionalVocabUsed.map((v, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <p className="text-sm-clamp font-bold text-dark-indigo shrink-0">{v.termEn}</p>
                                <div>
                                    <p className="text-xs text-cadet-blue mb-1.5">"{v.howUsed}"</p>
                                    {v.betterAlternativeEn && (
                                        <div className="flex items-start gap-2 text-amber-700">
                                            <span className="text-xs flex-shrink-0">{t('consider')}</span>
                                            <span className="text-xs font-medium">"{v.betterAlternativeEn}"</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {debrief.improvementSuggestions.length > 0 && (
                <Card className="p-6 gap-3">
                    <h2 className="font-serif text-2xl-clamp flex gap-2 items-center text-dark-indigo">
                        <span className="bg-amber-50 text-amber-600 rounded-lg p-2">
                            <Lightbulb size={16} />
                        </span>
                        {t('improvementAreas')}
                    </h2>
                    {debrief.improvementSuggestions.map((s, i) => (
                        <div key={i} className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">{s.area}</p>
                            <p className="text-sm-clamp text-amber-800 leading-relaxed">{s.tipL1}</p>
                            <p className="text-xs font-semibold text-amber-700">{t('example')} "{s.exampleEn}"</p>
                        </div>
                    ))}
                </Card>
            )}

            {debrief.professionalVocabUsed.length > 0 && (
                <Card type="sky" className="p-6 gap-3 flex-row flex-wrap justify-between items-center">
                    <div>
                        <h2 className="font-serif text-2xl-clamp text-dark-indigo">{t('saveVocabulary')}</h2>
                        <p className="text-sm-clamp text-dark-indigo mt-1">{t('saveVocabularyText', { n: debrief.professionalVocabUsed.length })}</p>
                    </div>

                    <Button
                        onClick={handleSaveVocab}
                        disabled={!vocabSaved ? savingVocab : true}
                        loading={savingVocab}
                        loadingText={t('saving')}
                        className="py-2"
                    >
                        <BookmarkPlus />
                        {!vocabSaved ? t('saveAll') : t('saved')}
                    </Button>
                </Card>
            )}
        </div>
    );
}
