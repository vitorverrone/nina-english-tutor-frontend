'use client';

import { useEffect, useState } from 'react';
import type {
    GrammarReference,
    SituationalReference,
    TopicReference,
} from '@english-teacher/shared';
import { useTranslations } from 'next-intl';
import { Card } from './Card';
import { Book, BookOpen, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_PREFIX = 'reference-open:';

export function TopicReferenceCard({ topicId, reference }: { topicId: string; reference: TopicReference }) {
    const t = useTranslations('chat');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem(STORAGE_PREFIX + topicId);
        if (stored === '1') setOpen(true);
    }, [topicId]);

    const toggle = () => {
        setOpen((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_PREFIX + topicId, next ? '1' : '0');
            }
            return next;
        });
    };

    return (
        <div className="bg-white md:border md:rounded-2xl border-pale-blue text-cadet-blue overflow-hidden p-0 gap-0">
            <button type="button" onClick={toggle} className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-sm-clamp transition hover:bg-blue-grey/50" aria-expanded={open}>
                <p className="inline-flex items-center gap-2">
                    {open ? <BookOpen size={16} /> : <Book size={16} />}
                    <span className="font-medium">
                        {open ? t('reference.closeButton') : t('reference.openButton')}
                    </span>
                </p>
                <span className="text-xs uppercase tracking-wide font-semibold">
                    {t(`reference.${reference.kind}.title`)}
                </span>
            </button>
            {open && (
                <div className="min-h-[100px] max-h-[45vh] sm:max-h-[55vh] overflow-y-auto">
                    {reference.kind === 'grammar' ? (
                        <GrammarTable reference={reference} />
                    ) : (
                        <SituationalTable reference={reference} />
                    )}
                </div>
            )}
        </div>
    );
}

function GrammarTable({ reference }: { reference: GrammarReference }) {
    const t = useTranslations('chat.reference.grammar');

    return (
        <div className="overflow-x-auto ">
            <table className="w-full text-sm-clamp">
                <thead>
                    <tr className="text-xs uppercase tracking-wider">
                        <Th>{t('name')}</Th>
                        <Th>{t('whatItIs')}</Th>
                        <Th>{t('formula')}</Th>
                        <Th>{t('example')}</Th>
                    </tr>
                </thead>
                <tbody>
                    {reference.groups.map((group, gi) => (
                        <GrammarGroup key={gi} group={group} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function GrammarGroup({ group }: { group: GrammarReference['groups'][number]; }) {
    return (
        <>
            {group.header && (
                <tr className="bg-indigo-50">
                    <td colSpan={4} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                        {group.header}
                    </td>
                </tr>
            )}
            {group.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-pale-blue align-top">
                    <Td className="font-medium whitespace-nowrap">
                        {row.name}
                    </Td>
                    <Td>{row.whatItIs}</Td>
                    <Td>
                        <FormulaChip text={row.formula} />
                    </Td>
                    <Td className="italic">{row.example}</Td>
                </tr>
            ))}
        </>
    );
}

function SituationalTable({ reference }: { reference: SituationalReference }) {
    const t = useTranslations('chat.reference.situational');

    return (
        <div className="">
            <div className="px-4 py-3 border-b border-t border-pale-blue">
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                    {t('contextLabel')}
                </div>
                <p className="text-sm-clamp leading-snug">
                    {reference.context}
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm-clamp">
                    <thead>
                        <tr className="bg-blue-grey text-xs uppercase tracking-wider text-dark-indigo">
                            <Th>{t('phrase')}</Th>
                            <Th>{t('function')}</Th>
                            <Th>{t('whenToUse')}</Th>
                            <Th>{t('example')}</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {reference.keyPhrases.map((row, i) => (
                            <tr key={i} className="border-t border-pale-blue align-top">
                                <Td className="font-medium">
                                    <span className="font-mono text-sm-clamp">{row.phrase}</span>
                                </Td>
                                <Td>{row.function}</Td>
                                <Td>{row.whenToUse}</Td>
                                <Td className="italic">{row.example ?? '—'}</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {reference.miniExchange && reference.miniExchange.length > 0 && (
                <div className="px-4 py-3 bg-alice-blue border-t border-pale-blue">
                    <div className="text-xs font-semibold uppercase tracking-widest text-cadet-blue mb-2">
                        {t('miniExchangeLabel')}
                    </div>
                    <ul className="space-y-1 text-sm-clamp">
                        {reference.miniExchange.map((line, i) => (
                            <li key={i} className="text-bluish-gray">
                                <span className="text-dark-indigo font-semibold mr-2">
                                    {line.role === 'You' ? t('roleYou') : t('roleOther')}:
                                </span>
                                <span>{line.line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-2 text-left font-semibold">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}

function FormulaChip({ text }: { text: string }) {
    return (
        <code className="inline-block rounded-md bg-blue-grey border border-pale-blue px-2 py-1 text-xs font-mono text-dark-indigo whitespace-pre-wrap">
            {text}
        </code>
    );
}
