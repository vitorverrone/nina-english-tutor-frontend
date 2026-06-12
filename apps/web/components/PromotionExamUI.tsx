'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { requestExam, startExam, submitExam, fetchExamById } from '@/lib/actions';
import type { PendingExamItems, PromotionResult } from '@english-teacher/shared';
import { ApiError } from '@/lib/api';
import { useExamStatus } from '../lib/use-exam-status';
import { Card } from './Card';
import { Button } from './Button';
import { Check, ChevronLeft, ChevronRight, Clock3, Frown, Layers, RefreshCcw, Timer, Trophy, TriangleAlert } from 'lucide-react';
import { Badge } from './Badge';
import { InputRadio } from './InputRadio';
import { Input } from './Input';
import { useTranslations } from 'next-intl';

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PromotionExamUI({ targetLevel }: { targetLevel: string }) {
    const t = useTranslations('');
    const tPromotion = useTranslations('promotion');
    const tErrors = useTranslations('errors');
    const router = useRouter();

    const [examId, setExamId] = useState<string | null>(null);
    const [examData, setExamData] = useState<PendingExamItems | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReviewing, setIsReviewing] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<PromotionResult | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const { status, error: statusError, mutate: mutateStatus } = useExamStatus(examId, 3000);

    useEffect(() => {
        const init = async () => {
            try {
                const storedId = localStorage.getItem('pendingExamId');
                if (storedId) {
                    setExamId(storedId);
                } else {
                    const res = await requestExam();
                    localStorage.setItem('pendingExamId', res.pendingExamId);
                    setExamId(res.pendingExamId);
                }
            } catch (err) {
                setError(err instanceof ApiError ? tErrors(err.code) : tPromotion('exam.async.requestError'));
            } finally {
                setIsInitializing(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (status?.status === 'started' && !examData) {
            fetchExamById(examId!).then(setExamData).catch((err) => {
                setError(err instanceof ApiError ? tErrors(err.code) : tPromotion('exam.async.loadQuestionsError'));
            });
        }
    }, [status?.status, examId, examData]);

    useEffect(() => {
        if (status?.status !== 'started' || !examData?.startedAt) return;

        const startedAt = new Date(examData.startedAt).getTime();
        const timeLimitMs = examData.timeLimit * 1000;
        const deadline = startedAt + timeLimitMs;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.min(examData.timeLimit, Math.floor((deadline - now) / 1000)));
            setTimeLeft(remaining);

            if (remaining <= 0 && !isSubmitting && !result) {
                handleAutoSubmit();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [status?.status, examData?.startedAt, examData?.timeLimit, isSubmitting, result]);

    useEffect(() => {
        const knownStatuses = new Set(['generating', 'ready', 'started', 'submitted', 'expired']);
        if (status?.status && !knownStatuses.has(status.status)) {
            setError(tPromotion('exam.async.unknownStatusError', { status: status.status }));
        }
    }, [status]);

    const handleStart = async () => {
        if (!examId) return;
        try {
            await startExam(examId);
            localStorage.removeItem('pendingExamId');
            localStorage.setItem('pendingExamId', examId);
            mutateStatus();
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : tPromotion('exam.async.startError'));
        }
    };

    const setAnswer = (itemId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [itemId]: value }));
    };

    const handleAutoSubmit = async () => {
        setIsConfirming(false);
        await handleSubmit();
    };

    const handleSubmit = async () => {
        if (!examId || !examData) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = examData.items.map((it) => ({
                itemId: it.id,
                userAnswer: answers[it.id] ?? '',
            }));
            const res = await submitExam(examId, payload);
            setResult(res);
            localStorage.removeItem('pendingExamId');
            setExamId(null);
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : tPromotion('exam.async.submitError'));
            setIsSubmitting(false);
        }
    };

    if (isInitializing) {
        return (
            <Card className="items-center">
                <div className="size-8 border-4 border-pale-blue border-t-primary rounded-full animate-spin mb-4" />
                <p>{tPromotion('exam.initializingExam')}</p>
            </Card>
        );
    }

    if (error || statusError) {
        return (
            <Card className="items-center text-center gap-3" type="red">
                <h3 className="text-2xl-clamp">{tPromotion('exam.error')}</h3>
                <p className="text-sm-clamp">{error ?? statusError?.message}</p>
                <Button
                    onClick={() => {
                        localStorage.removeItem('pendingExamId');
                        window.location.reload();
                    }}
                    className="py-3"
                    mode="red"
                >
                    {tPromotion('exam.tryAgain')}
                </Button>
            </Card>
        );
    }

    if (status?.status === 'generating') {
        return (
            <Card className="items-center text-center gap-3">
                <div className="size-10 border-4 border-pale-blue border-t-primary rounded-full animate-spin" />
                <h2 className="font-serif text-2xl-clamp text-dark-indigo">
                    {tPromotion('exam.async.generatingTitle')}
                </h2>
                <p className="text-sm-clamp text-cadet-blue max-w-sm mx-auto leading-relaxed">
                    {tPromotion('exam.async.generatingBody')}
                </p>
            </Card>
        );
    }

    if (status?.status === 'expired') {
        return (
            <Card className="text-center items-center gap-3">
                <h2 className="font-serif text-2xl-clamp text-dark-indigo">
                    {tPromotion('exam.async.expiredTitle')}
                </h2>
                <p className="text-sm-clamp text-cadet-blue max-w-sm mx-auto leading-relaxed">
                    {tPromotion('exam.async.expiredBody')}
                </p>
                <Button
                    onClick={() => {
                        localStorage.removeItem('pendingExamId');
                        window.location.reload();
                    }}
                    className="py-3"
                >
                    <RefreshCcw size={16} /> {tPromotion('exam.requestNewExam')}
                </Button>
            </Card>
        );
    }

    if (status?.status === 'ready') {
        return (
            <>
                <Card className="gap-3 p-8">
                    <p className="flex gap-2 items-center">
                        <Clock3 className="text-primary" />
                        45 {t('common.minutes')}
                    </p>
                    <p className="flex gap-2 items-center">
                        <Layers className="text-primary" />
                        {tPromotion('exam.questionTypes')}
                    </p>
                    <p className="flex gap-2 items-center">
                        <Check className="text-primary" />
                        {tPromotion('exam.passThreshold')}: 70%
                    </p>
                    <div className="border-t border-pale-blue w-full my-3" />
                    <div className="flex flex-row items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm-clamp rounded-xl px-4 py-3">
                        <TriangleAlert size={16} className="flex-shrink-0" />
                        {tPromotion('exam.failMessage')}
                    </div>
                </Card>
                <Button
                    onClick={handleStart}
                    className="mt-3 max-w-xs mx-auto w-full"
                >
                    {tPromotion('exam.startCta')}
                </Button>
            </>
        );
    }

    if (result) {
        const pct = Math.round(result.score * 100);
        return (
            <>
                <Card type={result.passed ? 'green' : 'amber'} className="items-center max-w-md w-full mx-auto">
                    {result.passed ? <Trophy size={48} className="text-emerald-600" /> : <Frown size={48} className="text-amber-600" />}
                    <h2 className="font-serif text-3xl-clamp">
                        {result.passed ? tPromotion('result.passedTitle') : tPromotion('result.failedTitle')}
                    </h2>
                    <h3 className={`font-serif text-3xl-clamp ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</h3>
                    <p>{result.correct} / {result.total} {tPromotion('result.correctAnswers')}</p>
                    <Badge mode={result.passed ? 'green' : 'warn'} className={``}>
                        {result.passed ? tPromotion('result.advancedTo', { newLevel: result.targetLevel }) : tPromotion('result.failedBody')}
                    </Badge>
                    <Button onClick={() => router.push('/')} className="mt-3 max-w-full w-[40%]">
                        {tPromotion('result.backHome')}
                    </Button>
                </Card>
            </>
        );
    }

    if (status?.status === 'started' && examData) {
        const totalItems = examData.items.length;
        const currentItem = examData.items[currentIndex];
        const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

        const goNext = () => {
            if (currentIndex < totalItems - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setIsReviewing(true);
                setHasReviewed(true);
            }
        };
        const goPrev = () => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
        };

        const timer = () => {
            return (
                timeLeft !== null && (
                    <span className={`text-sm-clamp font-medium flex items-center gap-1 ${timeLeft < 300 && 'text-red-400'}`}>
                        <Timer size={16} /> {formatTime(timeLeft)}
                    </span>
                )
            )
        }

        if (isReviewing) {
            return (
                <>
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-serif text-2xl-clamp text-dark-indigo">
                                {tPromotion('exam.reviewButton')}
                            </h2>
                            {timer()}
                        </div>
                        <ul className="flex flex-col gap-2 mb-6 min-h-[120px] max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {examData.items.map((it, idx) => {
                                const userAns = (answers[it.id] ?? '').trim();
                                const hasAnswer = userAns.length > 0;
                                const preview = it.stem.length > 60 ? it.stem.slice(0, 60) + '…' : it.stem;
                                return (
                                    <li key={it.id}>
                                        <Badge
                                            onClick={() => {
                                                setIsReviewing(false);
                                                setCurrentIndex(idx);
                                            }}
                                            className="w-full flex items-center text-left justify-between gap-3 px-4 py-3 rounded-lg"
                                        >
                                            <span className="text-sm-clamp flex-1 min-w-0">
                                                <span className="font-bold mr-2 inline-block">#{idx + 1}</span>
                                                <span>{preview}</span>
                                            </span>
                                            {hasAnswer ? (
                                                <span className="text-xs text-emerald-600 font-mono whitespace-nowrap max-w-[40%] truncate">
                                                    {userAns.length > 24 ? userAns.slice(0, 24) + '…' : userAns}
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 whitespace-nowrap">
                                                    {tPromotion('exam.unansweredBadge')}
                                                </span>
                                            )}
                                        </Badge>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>

                    <div className="flex justify-between gap-3 flex-wrap">
                        <Button
                            onClick={() => setIsReviewing(false)}
                            disabled={isSubmitting}
                            mode="logout"
                        >
                            {tPromotion('exam.previousButton')}
                        </Button>
                        <Button
                            onClick={() => setIsConfirming(true)}
                            disabled={isSubmitting}
                            mode="green"
                        >
                            {tPromotion('exam.submitButton')}
                        </Button>
                    </div>

                    {isConfirming && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                            <Card className="shadow-[0_20px_40px_rgba(30,27,75,0.16),_0_4px_12px_rgba(30,27,75,0.08)]">
                                <h3 className="text-lg">
                                    {tPromotion('exam.confirmTitle')}
                                </h3>
                                <p className="text-sm-clamp ">
                                    {tPromotion('exam.confirmBody', { answered: answeredCount, total: totalItems })}
                                </p>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        onClick={() => setIsConfirming(false)}
                                        disabled={isSubmitting}
                                        mode="red-soft"
                                    >
                                        {tPromotion('exam.cancel')}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? tPromotion('exam.submitting') : tPromotion('exam.confirmCta')}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            );
        }

        const currentAnswer = answers[currentItem.id] ?? '';
        const isLast = currentIndex === totalItems - 1;
        const kindLabel = tPromotion(`exam.kindLabel.${currentItem.kind}`) || currentItem.kind;

        return (
            <>
                <div className="w-full h-1 bg-pale-blue rounded-2xl overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
                    />
                </div>
                <Card className="mt-2 gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wider font-medium">
                            {kindLabel}
                        </span>
                        <div className="flex items-center gap-4">
                            {timer()}
                            {hasReviewed && (
                                <button
                                    onClick={() => setIsReviewing(true)}
                                    className="text-xs text-primary hover:text-primary/80 underline-offset-2 hover:underline hidden sm:block"
                                >
                                    {tPromotion('exam.reviewButton')}
                                </button>
                            )}
                            <Badge className="text-xs rounded">
                                {currentIndex + 1} / {totalItems}
                            </Badge>
                        </div>
                    </div>

                    {currentItem.passage && (
                        <div className="bg-blue-grey border border-pale-blue rounded-xl px-4 py-3">
                            <p className="leading-relaxed text-lg italic text-dark-indigo">
                                {currentItem.passage}
                            </p>
                        </div>
                    )}

                    <p className="text-lg leading-relaxed">
                        {currentItem.stem}
                    </p>

                    {currentItem.keyWord && (
                        <div className="bg-blue-grey border border-pale-blue rounded-xl px-4 py-3 flex flex-col gap-1">
                            <span className="text-sm-clamp text-cadet-blue">
                                {tPromotion('exam.keyWordLabel')}
                            </span>
                            <span className="font-bold text-lg text-dark-indigo">{currentItem.keyWord}</span>
                        </div>
                    )}

                    {currentItem.options ? (
                        <div className="flex flex-col gap-2">
                            {currentItem.options.map((opt, i) => {
                                const selected = currentAnswer === opt;
                                return (
                                    <InputRadio
                                        key={opt}
                                        label={opt}
                                        name={`question-${i}`}
                                        id={`question-${i}-option-${i}`}
                                        checked={selected}
                                        onChange={() => setAnswer(currentItem.id, opt)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            <Input
                                type="text"
                                value={currentAnswer}
                                onChange={(e) => setAnswer(currentItem.id, e.target.value)}
                                placeholder={tPromotion('exam.fillPlaceholder')}
                                autoFocus
                            />
                            <p className="text-xs text-cadet-blue">
                                {currentItem.kind === 'sentence_transformation' ? tPromotion('exam.reewriteSentenceLabel') : tPromotion('exam.fillHint')}
                            </p>
                        </>
                    )}
                </Card>
                <div className="flex justify-between gap-3">
                    <Button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className="px-4 py-2 gap-1"
                    >
                        <ChevronLeft size={16} /> {tPromotion('exam.previousButton')}
                    </Button>
                    <Button
                        onClick={goNext}
                        className="px-6 py-2 gap-1"
                        mode={isLast ? 'green' : 'primary'}
                    >
                        {isLast ? tPromotion('exam.reviewButton') : (
                            <> {tPromotion('exam.nextButton')} <ChevronRight size={16} /></>
                        )}
                    </Button>
                </div>
            </>
        );
    }

    return (
        <Card className="text-center items-center gap-3">
            <div className="size-8 border-4 border-pale-blue border-t-primary rounded-full animate-spin" />
        </Card>
    );
}
