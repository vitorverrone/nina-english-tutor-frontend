'use client';

import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
    WritingPromptOption,
    WritingSubmissionSummary,
} from '@english-teacher/shared';
import { submitWriting } from '@/lib/actions';
import { Card } from './Card';
import { TextArea } from './TextArea';
import { Select } from './Select';
import { Button } from './Button';

function wordCount(text: string): number {
    return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function scoreColor(score: number): string {
    if (score >= 7) return 'text-emerald-700';
    if (score >= 5.5) return 'text-cadet-blue';
    if (score >= 4) return 'text-amber-700';
    return 'text-red-700';
}

function RubricStat({ label, value }: { label: string; value: number }) {
    const tiers = [
        'bg-emerald-50 border-emerald-200 text-emerald-700',
        'bg-sky-50 border-sky-200 text-sky-700',
        'bg-amber-50 border-amber-200 text-amber-700',
        'bg-red-50 border-red-200 text-red-700',
    ];
    const tier = value >= 7 ? 0 : value >= 5.5 ? 1 : value >= 4 ? 2 : 3;
    return (
        <div className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${tiers[tier]}`}>
            <p className="font-serif text-2xl-clamp">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-75">{label}</p>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function localizePromptTitle(t: any, slug: string, fallback: string): string {
    return t(`writingPrompts.${slug}`) ?? fallback;
}

export function WritingWorkspace({ prompts, initialSubmissions }: { prompts: WritingPromptOption[]; initialSubmissions: WritingSubmissionSummary[] }) {
    const t = useTranslations('writing');
    const tAll = useTranslations('');
    const initialValue = t('selectValue');
    const [selectedSlug, setSelectedSlug] = useState(initialValue);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissions, setSubmissions] =
        useState<WritingSubmissionSummary[]>(initialSubmissions);
    const [openId, setOpenId] = useState<string | null>(
        initialSubmissions[0]?.id ?? null,
    );

    const selected = useMemo(
        () => prompts.find((p) => p.slug === selectedSlug) ?? prompts[0] ?? null,
        [prompts, selectedSlug],
    );

    const submit = async () => {
        if (!selected || busy) return;
        const trimmed = text.trim();
        if (trimmed.length < 20) {
            setError(t('tooShort'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await submitWriting({
                promptSlug: selected.slug,
                studentText: trimmed,
            });
            setSubmissions((s) => [result, ...s]);
            setOpenId(result.id);
            setText('');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (prompts.length === 0) {
        return (
            <Card className="text-center text-sm-clamp">
                {t('noPrompts')}
            </Card>
        );
    }

    const selectOptions = prompts.map((p) => ({
        slug: p.slug,
        optValue: `${localizePromptTitle(tAll, p.slug, p.title)} · ${p.cefrLevel}`,
    }));

    return (
        <>
            <Card className="p-5 gap-3">
                <Select options={selectOptions} label={t('promptLabel')} value={selectedSlug} clickFunction={setSelectedSlug} />

                {selectedSlug !== initialValue && (
                    <div className="rounded-2xl bg-blue-grey border border-pale-blue px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue mb-1">{t('taskLabel')}</p>
                        <p className="text-sm-clamp leading-relaxed text-dark-indigo">{selected?.body}</p>
                    </div>
                )}

                <TextArea
                    label={t('textLabel')}
                    name="writing_textarea"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('textPlaceholder')}
                    rows={12}
                />

                {error && <Card type="red" className="text-sm-clamp">{error}</Card>}

                <div className="flex flex-wrap gap-3 items-start justify-between">
                    <p className="text-xs text-cadet-blue">{t('wordsAndChars', { words: wordCount(text), chars: text.trim().length })}</p>
                    <Button onClick={submit} disabled={busy || text.trim().length < 20} loading={busy} loadingText={t('submitting')} className="py-3">
                        {t('submit')} <Send size={16} />
                    </Button>
                </div>
            </Card>

            <section className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl-clamp text-dark-indigo">{t('previousTitle')}</h2>
                {submissions.length === 0 ? (
                    <Card className="text-center">
                        {t('nothingYet')}
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {submissions.map((s) => {
                            const isOpen = openId === s.id;
                            return (
                                <Card key={s.id} className="overflow-hidden p-0 gap-0">
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(isOpen ? null : s.id)}
                                        className="w-full text-left flex items-center justify-between gap-4 p-5 transition hover:bg-blue-grey/50"
                                    >
                                        <div>
                                            <div className="font-semibold text-dark-indigo">{s.promptTitle}</div>
                                            <div className="text-xs mt-1 text-cadet-blue">
                                                {new Date(s.createdAt).toLocaleString(tAll('dateLocale'))}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-center">
                                            <div className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue">{t('overall')}</div>
                                            <div className={`text-3xl-clamp font-serif tabular-nums ${scoreColor(s.rubric.overall)}`}>
                                                {s.rubric.overall.toFixed(1)}
                                            </div>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-pale-blue p-5 flex flex-col gap-5">
                                            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                                                <RubricStat label={t('rubricTask')} value={s.rubric.task} />
                                                <RubricStat label={t('rubricGrammar')} value={s.rubric.grammar} />
                                                <RubricStat label={t('rubricVocab')} value={s.rubric.vocab} />
                                                <RubricStat label={t('rubricCohesion')} value={s.rubric.cohesion} />
                                            </div>

                                            {s.feedbackL1 && (
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue mb-1">{t('feedback')}</p>
                                                    <p className="text-sm-clamp whitespace-pre-wrap leading-relaxed text-dark-indigo">{s.feedbackL1}</p>
                                                </div>
                                            )}

                                            {s.revisedVersion && (
                                                <div className="rounded-2xl bg-blue-grey border border-pale-blue px-4 py-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue mb-1">{t('revisedNative')}</p>
                                                    <p className="text-sm-clamp italic whitespace-pre-wrap text-dark-indigo leading-relaxed">
                                                        {s.revisedVersion}
                                                    </p>
                                                </div>
                                            )}

                                            <details className="text-sm-clamp">
                                                <summary className="cursor-pointer text-cadet-blue">{t('viewOriginal')}</summary>
                                                <div className="mt-2 rounded-2xl bg-blue-grey border border-pale-blue px-4 py-3 font-mono text-xs text-bluish-gray whitespace-pre-wrap">
                                                    {s.studentText}
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    );
}
