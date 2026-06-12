'use client';

import { useState, useRef } from 'react';
import type { InterviewJobRole, StartInterviewResponse } from '@english-teacher/shared';
import { uploadResume, startInterview } from '@/lib/actions';
import { ApiError } from '@/lib/api';
import { CircleCheck, FileUp, Play, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { Card } from './Card';
import { useTranslations } from 'next-intl';

const JOB_ROLES: { key: InterviewJobRole }[] = [
    { key: 'technology' },
    { key: 'marketing' },
    { key: 'finance' },
    { key: 'healthcare' },
    { key: 'education' },
    { key: 'sales' },
    { key: 'other' },
];

interface Props {
    onStart: (session: StartInterviewResponse) => void;
}

export function InterviewSetup({ onStart }: Props) {
    const t = useTranslations('interview.setup');
    const tInterview = useTranslations('interview');
    const tErrors = useTranslations('errors');
    const [jobRole, setJobRole] = useState<InterviewJobRole | ''>('');
    const [customJobRole, setCustomJobRole] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUploading(true);
        setFileName(file.name);

        try {
            const result = await uploadResume(file);
            setResumeText(result.resumeText);
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : tErrors('UNKNOWN_ERROR'));
            setFileName('');
            setResumeText('');
        } finally {
            setUploading(false);
        }
    };

    const handleStart = async () => {
        if (!jobRole) { setError(t('selectRole')); return; }
        if (jobRole === 'other' && !customJobRole.trim()) {
            setError(t('describeRole')); return;
        }
        setError('');
        setStarting(true);
        try {
            const session = await startInterview({
                resumeText,
                jobRole,
                customJobRole: customJobRole.trim() || undefined,
            });
            onStart(session);
        } catch (err) {
            setError(err instanceof ApiError ? tErrors(err.code) : tErrors('UNKNOWN_ERROR'));
        } finally {
            setStarting(false);
        }
    };

    return (
        <>
            <p className="text-sm-clamp text-cadet-blue leading-relaxed">
                {t('text')}
            </p>
            <Card className="shadow-[0_8px_24px_rgba(30,27,75,0.12),_0_2px_6px_rgba(30,27,75,0.06)] p-5 gap-5">
                <div>
                    <p className="text-sm-clamp font-semibold text-bluish-gray mb-2">
                        {t.rich('resumeTitle', {
                            optional: (chunks) => <span className="font-normal text-cadet-blue">{chunks}</span>
                        })}
                    </p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-pale-blue hover:border-primary/60 hover:bg-alice-blue transition-colors text-left disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                                <span className="text-sm-clamp text-cadet-blue">{t('extractingText')}</span>
                            </>
                        ) : fileName ? (
                            <>
                                <CircleCheck size={18} className="text-primary" />
                                <span className="text-sm-clamp text-dark-indigo truncate">{fileName}</span>
                                <span className="ml-auto text-xs text-primary flex-shrink-0">{t('change')}</span>
                            </>
                        ) : (
                            <>
                                <FileUp size={20} className="text-cadet-blue" />
                                <span className="text-sm-clamp text-cadet-blue">{t('clickToUpload')}</span>
                            </>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    {!fileName && (
                        <p className="text-xs text-cadet-blue mt-2">
                            {t('resumeText')}
                        </p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-cadet-blue mt-2">
                        <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                        {t('resumePrivacy')}
                    </p>
                </div>

                <div>
                    <p className="text-sm-clamp font-semibold text-bluish-gray mb-2">
                        {t('targetLabel')} <span className="text-red-500">*</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {JOB_ROLES.map((r) => {
                            const jobLabel = tInterview(`target.${r.key}.label`)
                            return (
                                <Badge key={r.key} onClick={() => { setJobRole(r.key); setError(''); }} className={`py-3 border text-xs ${jobRole === r.key ? 'bg-alice-blue border-primary/30 !text-primary' : 'border-pale-blue'}`}>
                                    {jobLabel}
                                </Badge>
                            )
                        })}
                    </div>
                    {jobRole === 'other' && (
                        <Input
                            name="target_role"
                            placeholder={tInterview('target.other.placeholder')}
                            value={customJobRole}
                            onChange={(e) => setCustomJobRole(e.target.value)}
                            className="mt-3"
                        />
                    )}
                </div>

                {error && <Card type="red" className="text-sm-clamp">{error}</Card>}

                <Button className="mx-auto px-6" loadingText="Starting interview…" loading={starting || uploading} disabled={!jobRole || uploading || starting} onClick={handleStart}>
                    {t('cta')} <Play size={16} />
                </Button>
            </Card>
        </>
    );
}
