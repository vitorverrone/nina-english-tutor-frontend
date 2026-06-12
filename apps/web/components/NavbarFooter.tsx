'use client';

import { useState } from 'react';
import { Link, usePathname } from "@/lib/navigation";
import { useTranslations } from 'next-intl';
import type { NavLink } from '@/app/[locale]/(app)/layout';

export function NavbarFooter({ navLinks }: { navLinks: NavLink[] }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const t = useTranslations('navbar');
    const tCommon = useTranslations('common');

    return (
        <>
            {pathname.endsWith('/') &&
                <aside className="block md:hidden bg-white w-full border-sand border-t z-50">
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
