'use client';

import { NativeLanguage, PlacementQuestion, PlacementResult, UserGoal } from "@english-teacher/shared";
import { BookOpen, Briefcase, Check, ClipboardCheck, Globe, Layers, MessagesSquare, MousePointerClick } from "lucide-react";
import { useState } from "react";

import { Card } from "./Card";
import { Input } from "./Input";
import { TextArea } from "./TextArea";
import { InputRadio } from "./InputRadio";
import { Button } from "./Button";
import { submitOnboarding, finishOnboarding } from "@/lib/actions";
import { ApiError } from "@/lib/api";
import { MicButton } from "./MicButton";
import { useTranslations } from "next-intl";

type Step = 'language' | 'goal' | 'questions';

const LANGUAGE_OPTIONS: Array<{ code: NativeLanguage; label: string }> = [
    { code: 'pt', label: 'Português (Brasil)' },
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
];
const STEPS: Step[] = ['language', 'goal', 'questions'];

const GOAL_OPTIONS: Array<{ icon: React.ReactNode, key: UserGoal }> = [
    { icon: <MessagesSquare className="text-primary" />, key: 'conversation' },
    { icon: <BookOpen className="text-primary" />, key: 'grammar' },
    { icon: <Layers className="text-primary" />, key: 'vocabulary' },
    { icon: <ClipboardCheck className="text-primary" />, key: 'exam' },
    { icon: <Briefcase className="text-primary" />, key: 'professional' },
];

export function OnboardingForm({ questions }: { questions: PlacementQuestion[] }) {
    const t = useTranslations('onboarding');
    const tAll = useTranslations('');
    const tErrors = useTranslations('errors');
    const [step, setStep] = useState<Step>('language');
    const [language, setLanguage] = useState<NativeLanguage | null>(null);
    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PlacementResult | null>(null);

    const currentStepIndex = STEPS.indexOf(step);
    let content;

    const setAnswer = (i: number, value: string) => {
        setAnswers((prev) => {
            const next = [...prev];
            next[i] = value;
            return next;
        });
    };

    const chooseLanguage = (code: NativeLanguage) => {
        setLanguage(code);
        setStep('goal');
    };

    const confirmGoal = (goal: UserGoal) => {
        setGoal(goal);
        setStep('questions');
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!language || !goal) return;
        setError(null);
        setSubmitting(true);

        try {
            const res = await submitOnboarding(answers, language, goal);
            setResult(res);
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : t('submitError'));
        } finally {
            setSubmitting(false);
        }
    };


    if (result) {
        return (
            <div className="flex flex-col gap-4 items-center justify-center">
                <div className="rounded-full bg-emerald-50 border border-emerald-200 w-16 h-16 flex items-center justify-center">
                    <Check className="text-emerald-600" size={28} />
                </div>

                <p className="text-sm-clamp font-bold">{t('cefrLabel')}</p>
                <p className="bg-primary text-white font-serif w-24 h-24 rounded-3xl flex items-center justify-center text-4xl-clamp">{result.cefrLevel}</p>

                {result.rationale && (
                    <Card>
                        <p className="text-sm-clamp text-bluish-gray font-medium">{result.rationale}</p>
                        {result.focusAreas.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-pale-blue">
                                <p className="text-silver-blue mb-2 font-bold text-xs uppercase">{t('focusLabel')}</p>
                                <ul className="list-disc list-inside font-medium text-bluish-gray text-sm-clamp space-y-1">
                                    {result.focusAreas.map((f, i) => (
                                        <li key={i}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                )}

                <Button onClick={() => finishOnboarding(language!)}>
                    {t('cta')}
                </Button>
            </div>
        );
    }

    if (step === 'language') {
        content = (
            <>
                <div className="flex flex-col gap-2 mb-8">
                    <BookOpen className="h-12 w-12 text-primary" />
                    <h1 className="text-3xl-clamp font-serif text-dark-indigo">{t('welcome')}</h1>
                    <p className="text-cadet-blue">{t('chooseLanguage')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LANGUAGE_OPTIONS.map(({ code, label }) => (
                        <Card className="group flex gap-2 flex-col cursor-pointer hover:border-primary/60 border-2 hover:bg-alice-blue" key={code} onClick={() => chooseLanguage(code)}>
                            <Globe className="text-cadet-blue group-hover:text-primary" />
                            <h2 className="text-xl font-serif">{label}</h2>
                        </Card>
                    ))}
                </div>
                <p className="flex gap-1 items-center mt-6 text-sm-clamp text-cadet-blue justify-center">
                    <MousePointerClick className="h-4 w-4" />
                    {tAll('common.tapToContinue')}
                </p>
            </>
        )
    }

    if (step === 'goal') {
        content = (
            <>
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl-clamp font-serif text-dark-indigo">{t('goalStep.title')}</h1>
                    <p className="text-cadet-blue">{t('goalStep.intro')}</p>
                </div>
                <div className="flex flex-col gap-4">
                    {GOAL_OPTIONS.map(({ icon, key }) => (
                        <Card className="group flex flex-row gap-3 cursor-pointer items-center p-4 rounded-2xl hover:border-primary/60 hover:bg-alice-blue" key={key} onClick={() => confirmGoal(key)}>
                            {icon}
                            <div className="flex flex-col gap-1">
                                <p className="text-sm-clamp font-bold">{t(`goalStep.options.${key}.title`)}</p>
                                <p className="text-cadet-blue text-sm-clamp">{t(`goalStep.options.${key}.text`)}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </>
        )
    }

    if (step === 'questions') {
        content = (
            <>
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl-clamp font-serif text-dark-indigo">{t('testTitle')}</h1>
                    <p className="text-cadet-blue">{t('intro')}</p>
                </div>
                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <Card className="flex flex-col gap-6">
                        {questions.map((q, i) => (
                            <div key={q.index} className="space-y-2">
                                {q.kind === 'writing' && (
                                    <TextArea
                                        className="whitespace-pre-line"
                                        label={q.question}
                                        name={`question-${i}`}
                                        value={answers[i]}
                                        onChange={(e) => setAnswer(i, e.target.value)}
                                        rows={3}
                                        disabled={submitting}
                                    />
                                )}

                                {q.kind === 'fill' && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-silver-blue text-xs font-semibold">{t('fillPlaceholder')}</p>
                                        <p className="text-sm-clamp font-medium">{q.question}</p>
                                        <Input
                                            type="text"
                                            label=""
                                            name={`question-${i}`}
                                            value={answers[i]}
                                            onChange={(e) => setAnswer(i, e.target.value)}
                                            disabled={submitting}
                                            autoComplete="off"
                                            autoCapitalize="off"
                                            spellCheck={false}
                                        />
                                    </div>
                                )}

                                {q.kind === 'mc' && q.options && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-silver-blue text-xs font-semibold">{t('fillPlaceholder')}</p>
                                        <p className="text-sm-clamp font-medium">{q.question}</p>
                                        {q.options.map((opt, index) => {
                                            const selected = answers[i] === opt;
                                            return (
                                                <InputRadio
                                                    key={opt}
                                                    label={opt}
                                                    name={`question-${i}`}
                                                    id={`question-${i}-option-${index}`}
                                                    checked={selected}
                                                    onChange={() => setAnswer(i, opt)}
                                                    disabled={submitting}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </Card>
                    {error && <Card type="red" className="text-sm-clamp">{error}</Card>}
                    <Button type="submit" disabled={submitting} loading={submitting} loadingText={t('submitting')}>{t('submit')}</Button>
                </form>
            </>
        )
    }

    return (
        <>
            <div className="flex gap-2 mb-5 items-center">
                {STEPS.map((_, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i <= currentStepIndex ? 'bg-primary' : 'bg-pale-blue'}`} />
                ))}
                <span className="text-xs text-cadet-blue ml-1 font-semibold">
                    {t('questionLabel', { a: currentStepIndex + 1, b: STEPS.length })}
                </span>
            </div>
            {content}
        </>
    )
}
