import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export type CardTypes = 'default' | 'amber' | 'green' | 'indigo' | 'slate' | 'sky' | 'fuchsia' | 'chat-you' | 'chat-nina' | 'red';

export const Card = forwardRef<HTMLDivElement, { type?: CardTypes, link?: boolean } & HTMLAttributes<HTMLDivElement>>(({ children, className, type = 'default', link = false, onClick, onKeyDown, ...rest }, ref) => {

    const classes = {
        'default': 'bg-white border-pale-blue text-cadet-blue [&_.font-serif]:text-dark-indigo [&_.font-bold]:text-dark-indigo',
        'amber': `bg-amber-50 border-amber-300 text-amber-700 [&_.font-bold]:text-amber-900 ${link && 'hover:bg-yellow-100 hover:border-amber-500'}`,
        'green': `bg-green-50 border-emerald-300 text-emerald-800 [&_.font-bold]:text-emerald-900 ${link && 'hover:bg-emerald-100 border:border-green-400'}`,
        'indigo': `bg-indigo-50 border-indigo-200 text-indigo-500 [&_.font-bold]:text-indigo-800 ${link && 'hover:bg-indigo-100 hover:border-indigo-300'}`,
        'slate': 'bg-slate-50 border-slate-200 text-cadet-blue [&_.font-bold]:text-dark-indigo',
        'sky': `bg-sky-50 border-sky-200 text-sky-500 [&_.font-bold]:text-sky-800 ${link && 'hover:bg-sky-100 hover:border-sky-300'}`,
        'fuchsia': `bg-fuchsia-50 border-fuchsia-400 text-purple-500 [&_.font-bold]:text-purple-800 ${link && 'hover:bg-fuchsia-100 hover:border-fuchsia-500'}`,
        'chat-you': 'bg-blue-50 border-blue-200 text-dark-indigo',
        'chat-nina': 'bg-slate-50 border-slate-200 text-dark-indigo',
        'red': `bg-red-50 border-red-200 text-red-800 ${link && 'hover:bg-red-100 hover:border-red-400'}`
    };

    const interactive = !!onClick;

    return (
        <div
            ref={ref}
            className={cn(`flex flex-col gap-2 rounded-2xl p-4 border transition-all scale-100 ${link && 'active:scale-99 hover:shadow-[0_4px_12px_rgba(30,27,75,0.08)]'} ${classes[type]}`, className)}
            onClick={onClick}
            onKeyDown={onKeyDown ?? (interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } } : undefined)}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            {...rest}
        >
            {children}
        </div>
    );
});

Card.displayName = "Card";
