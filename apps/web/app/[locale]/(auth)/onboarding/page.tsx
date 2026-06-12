import { fetchPlacementQuestions, fetchProfile } from '@/lib/api';
import { OnboardingForm } from '@/components/OnboardingForm';
import { redirect } from 'next/navigation';
import { getServerAuthToken } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
    const token = await getServerAuthToken();
    const [profile, questions] = await Promise.all([
        fetchProfile(token).catch(() => null),
        fetchPlacementQuestions().catch(() => []),
    ]);

    if (profile?.onboardingCompleted) {
        redirect('/');
    }

    return (
        <main className="mx-auto py-16 px-4 flex flex-col w-[600px] max-w-full text-left">
            <OnboardingForm questions={questions} />
        </main>
    );
}
