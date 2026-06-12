import { Navbar } from '@/components/Navbar';
import { getCurrentUser } from '@/lib/get-current-user';
import { BookOpen, Briefcase, Headphones, Home, PenTool, Settings } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { NavbarFooter } from '@/components/NavbarFooter';
import { ReactNode } from 'react';

export type NavLink = {
    url: string;
    title: string;
    icon: ReactNode;
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const profile = await getCurrentUser();
    const t = await getTranslations('navbar');

    const navLinks = [
        { url: '/', title: t('navHome'), icon: <Home /> },
        { url: '/interview', title: t('navInterview'), icon: <Briefcase /> },
        { url: '/writing', title: t('navWriting'), icon: <PenTool /> },
        { url: '/cultural', title: t('navCulture'), icon: <BookOpen /> },
        { url: '/dictogloss', title: t('navDictogloss'), icon: <Headphones /> },
        { url: '/settings', title: t('navSettings'), icon: <Settings /> },
    ];

    return (
        <div className="flex flex-col md:flex-row h-[100dvh]">
            {profile !== null && <Navbar navLinks={navLinks} profile={profile} />}
            <div className={`flex-1 overflow-auto`}>
                {children}
            </div>
            <NavbarFooter navLinks={navLinks} />
        </div>
    );
}
