'use client'

import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import React, { HTMLAttributes, ReactNode } from "react";

export function InnerHeader({ children, className, text }: { text: string | ReactNode } & HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();

    return (
        <div className={cn(`p-4 md:p-0 flex justify-between bg-sand md:bg-transparent items-center gap-2`, className)}>
            <button onClick={() => router.push('/')} className="md:hidden bg-white text-black rounded-lg p-2 shadow-lg shadow-[rgba(30,27,75,0.12)]">
                <ChevronLeft size={14} />
            </button>
            <h1 className="font-serif text-3xl-clamp flex-1 truncate">
                {text}
            </h1>
            {children}
        </div>
    )
}
