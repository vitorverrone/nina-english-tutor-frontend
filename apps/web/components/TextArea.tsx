import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

export function TextArea({ label, name, className, placeholder = '', ...rest }: { label?: string; name: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && (
                <label htmlFor={name} className="text-sm-clamp font-bold text-bluish-gray">
                    {label}
                </label>
            )}
            <textarea id={name} name={name} {...rest} className="bg-white border border-pale-blue rounded-2xl py-3 px-4 text-dark-indigo placeholder:text-cadet-blue transition-all focus:outline-none focus:border-primary focus:shadow-[0_4px_12px_rgba(30,27,75,0.08)] resize-none" placeholder={placeholder} />
        </div>
    );
}
