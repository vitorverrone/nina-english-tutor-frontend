'use client';

import { useState } from 'react';
import { Link, usePathname } from "@/lib/navigation";
import { Button } from "./Button";
import { BookOpen } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { LanguageSwitch } from "./LanguageSwitch";
import { Badge } from './Badge';
import { useTranslations } from 'next-intl';
import type { NavLink } from '@/app/[locale]/(app)/layout';

type ProfileType = {
    name: string;
    cefrLevel: string | null;
    coachLanguage: string;
    immersionMode: Boolean;
    nativeLanguage: string;
};

export function Navbar({ profile, navLinks }: { profile: ProfileType, navLinks: NavLink[] }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const t = useTranslations('navbar');
    const tCommon = useTranslations('common');

    return (
        <>
            <aside className={`w-full md:w-64 p-4 md:p-6 flex flex-col bg-sand gap-3 md:shadow-[0_8px_24px_rgba(30,27,75,0.12),_0_2px_6px_rgba(30,27,75,0.06)] z-50 transition-transform duration-300 ease-out md:translate-x-0 ${!pathname.endsWith('/') && 'hidden md:flex'}`}>
                <div className="flex items-center justify-between md:pb-3">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-deep-cyan" size={28} />
                        <div className="flex flex-col gap-0.5">
                            <p className="font-serif text-lg text-dark-indigo">{tCommon('appTitle')}</p>
                            <p className="text-xs text-cadet-blue">{t('subtitle')}</p>
                        </div>
                    </div>
                    <div className="md:hidden flex gap-3 items-center">
                        {profile.cefrLevel && <Badge className="text-xs">{profile.cefrLevel}</Badge>}
                        <button
                            onClick={() => setOpen(!open)}
                            aria-label={open ? t('closeMenu') : t('openMenu')}
                            className="w-10 h-10 text-white bg-deep-cyan rounded-full"
                        >
                            {profile.name.slice(0, 1)}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-3 hidden md:flex pt-3 md:pt-0">
                    {navLinks.map((item) => {
                        const selected = pathname.endsWith(item.url);
                        return (
                            <Link key={item.url} href={item.url} onClick={() => setOpen(false)}>
                                <Button mode="nav-button" className={`font-normal ${selected && 'bg-white' || 'hover:bg-white/50'}`}>
                                    {item.icon}
                                    {item.title}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                <div className={`md:flex-col gap-2 pt-3 justify-between ${open ? 'flex' : 'hidden'} md:flex`}>
                    {profile && !profile?.immersionMode && (
                        <LanguageSwitch
                            nativeLanguage={profile.nativeLanguage}
                            coachLanguage={profile.coachLanguage}
                        />
                    )}
                    <div className="flex items-center justify-between">
                        <p className="hidden md:flex items-center justify-center font-bold w-10 h-10 text-white bg-deep-cyan rounded-full">{profile.cefrLevel ?? '—'}</p>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {pathname.endsWith('/') &&
                <aside className="block md:hidden fixed bottom-0 bg-white w-full border-sand border-t z-50">
                    <nav className="flex">
                        {navLinks.map((item) => {
                            const selected = pathname.endsWith(item.url);
                            return (
                                <Link key={item.url} href={item.url} className={`flex-1 text-xs flex flex-col items-center font-bold py-3 text-silver-blue ${selected && '!text-deep-cyan'}`}>
                                    {item.icon}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>
            }
        </>
    );
}
