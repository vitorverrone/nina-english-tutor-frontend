import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { InnerHeader } from '@/components/InnerHeader';
import { Card } from '@/components/Card';
import { DeleteAccountForm } from '@/components/DeleteAccountForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const t = await getTranslations('settings');
    const profile = await getCurrentUser();

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('title')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <Card className="flex flex-col gap-4">
                    <p className="font-serif text-2xl-clamp">{t('profile')}</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm-clamp">
                            <span className="text-cadet-blue">{t('name')}</span>
                            <span className="font-semibold text-dark-indigo">{profile?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm-clamp">
                            <span className="text-cadet-blue">{t('email')}</span>
                            <span className="font-semibold text-dark-indigo">{profile?.email}</span>
                        </div>
                        {profile?.cefrLevel && (
                            <div className="flex justify-between text-sm-clamp">
                                <span className="text-cadet-blue">{t('level')}</span>
                                <span className="font-semibold text-dark-indigo">{profile.cefrLevel}</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="flex flex-col gap-4 border-red-200">
                    <p className="font-serif text-2xl-clamp text-red-600">{t('dangerZone')}</p>
                    <DeleteAccountForm />
                </Card>
            </div>
        </main>
    );
}
