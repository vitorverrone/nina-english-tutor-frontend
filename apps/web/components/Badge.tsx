import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export type BadgeTypes = 'default' | 'warn' | 'danger' | 'sky' | 'green' | 'indigo' | 'fuchsia' | 'transparent' | 'cyan';

export function Badge({ children, className, mode = 'default', ...rest }: { mode?: BadgeTypes } & ButtonHTMLAttributes<HTMLButtonElement>) {
    const classes = {
        'default': 'bg-blue-grey text-dark-indigo',
        'transparent': 'border border-deep-cyan text-deep-cyan',
        'warn': '!text-amber-900 bg-amber-100',
        'danger': 'bg-red-100 !text-red-800 border border-red-800',
        'green': 'bg-emerald-100 !text-green-600',
        'yellow': 'bg-yellow-10 !text-amber-700',
        'sky': 'bg-sky-50 border-sky-200 text-sky-700 border',
        'indigo': 'bg-indigo-50 text-indigo-500',
        'fuchsia': 'bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700',
        'cyan': 'border-deep-cyan text-deep-cyan border'
    };

    return (
        <button type="button" {...rest} tabIndex={rest.onClick ? 0 : -1} className={cn(`${!rest.onClick && "cursor-default pointer-events-none"} flex items-center justify-center gap-1 font-semibold text-sm-clamp rounded-full py-1 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${classes[mode]}`, className)}>
            {children}
        </button>
    );
}
