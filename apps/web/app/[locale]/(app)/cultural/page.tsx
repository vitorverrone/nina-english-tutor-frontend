import { Card } from '@/components/Card';
import { fetchCulturalNotes } from '@/lib/api';
import { getTranslations } from 'next-intl/server';
import { getServerAuthToken } from '@/lib/actions';
import { Badge } from '@/components/Badge';
import { InnerHeader } from '@/components/InnerHeader';

export const dynamic = 'force-dynamic';

export default async function CulturalNotesPage() {
    const t = await getTranslations('');
    const token = await getServerAuthToken();

    const notes = await fetchCulturalNotes(token).catch(() => []);

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('cultural.title')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <p className="text-sm-clamp text-cadet-blue">
                    {t('cultural.description')}
                </p>
                {notes.length === 0 ? (
                    <Card type="default" className="text-center p-6 gap-3">
                        <p className="font-serif text-3xl-clamp text-dark-indigo">
                            {t('cultural.emptyTitle')}
                        </p>
                        <p className="text-sm-clamp text-cadet-blue">
                            {t('cultural.emptyText')}
                        </p>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notes.map((n) => {
                            const tagLabel = n.tag ? t(`cultural.tagLabel.${n.tag}`) ?? n.tag : null;
                            return (
                                <Card key={n.id} className="p-5 gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-serif text-2xl-clamp text-dark-indigo">{n.title}</h3>

                                        {tagLabel && (
                                            <Badge className="text-xs uppercase tracking-wide rounded shrink-0" mode="fuchsia">
                                                {tagLabel}
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm-clamp text-dark-indigo leading-relaxed">{n.noteL1}</p>

                                    {n.noteEn && (
                                        <p className="text-sm-clamp text-cadet-blue italic">"{n.noteEn}"</p>
                                    )}

                                    <div className="text-xs text-cadet-blue">
                                        {new Date(n.createdAt).toLocaleDateString(t('dateLocale'))}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
