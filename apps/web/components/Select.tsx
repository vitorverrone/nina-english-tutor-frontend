'use client';

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { HTMLAttributes, useEffect, useRef, useState } from "react";

export function Select({ label, className, options, clickFunction, value, ...rest }: { value: string, clickFunction: (slug: string) => void, label?: string, options: Array<{ slug: string; optValue: string }> } & HTMLAttributes<HTMLDivElement>) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(value);

    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={cn("w-full flex flex-col gap-2", className)} {...rest} ref={selectRef}>
            {label && (
                <p className="text-sm-clamp font-bold text-bluish-gray">
                    {label}
                </p>
            )}
            <div className="relative w-full">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "text-sm-clamp flex items-center justify-between w-full border py-3 px-4 transition-all bg-alice-blue text-dark-indigo",
                        isOpen
                            ? "rounded-t-2xl border-pale-blue border-b-transparent"
                            : "rounded-2xl border-pale-blue hover:border-primary/60",
                        "focus:outline-none focus:border-primary focus:shadow-[0_4px_12px_rgba(30,27,75,0.08)]"
                    )}
                >
                    <span className="truncate">{selected}</span>
                    <ChevronDown size={18} className={cn("text-cadet-blue transition-transform duration-200 shrink-0 ml-2", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <ul className="absolute z-50 w-full bg-white border border-pale-blue border-t-0 rounded-b-2xl shadow-[0_8px_24px_rgba(30,27,75,0.12),_0_2px_6px_rgba(30,27,75,0.06)] overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {options.map((opt) => (
                            <li
                                key={opt.slug}
                                onClick={() => {
                                    setSelected(opt.optValue);
                                    setIsOpen(false);
                                    clickFunction(opt.slug);
                                }}
                                className="text-sm-clamp px-4 py-3 hover:bg-alice-blue cursor-pointer text-bluish-gray transition-colors border-t border-pale-blue/30 first:border-t-0"
                            >
                                {opt.optValue}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
