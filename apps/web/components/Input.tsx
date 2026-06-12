import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ label, name, type = 'text', className, ...rest }: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && (
                <label htmlFor={name} className="text-sm-clamp font-bold text-bluish-gray">
                    {label}
                </label>
            )}
            <input id={name} name={name} type={type} {...rest} className="bg-alice-blue border border-pale-blue rounded-2xl py-3 px-4 text-dark-indigo placeholder:text-cadet-blue transition-all focus:outline-none focus:border-primary focus:shadow-[0_4px_12px_rgba(30,27,75,0.08)]" />
        </div>
    );
}
