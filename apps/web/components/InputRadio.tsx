import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function InputRadio({ label, name, id, className, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label htmlFor={id} className={cn("flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all border-pale-blue hover:bg-alice-blue has-[:checked]:border-primary has-[:checked]:bg-alice-blue", className)}>
            <input id={id} name={name} type="radio" {...rest} className="peer hidden" />
            <div className="w-5 h-5 border-2 border-pale-blue rounded-full flex items-center justify-center peer-checked:border-primary peer-checked:bg-primary transition-colors">
                <div className="w-2 h-2 bg-white rounded-full " />
            </div>
            <span className="text-sm-clamp peer-checked:text-primary">
                {label}
            </span>
        </label>
    );
}
