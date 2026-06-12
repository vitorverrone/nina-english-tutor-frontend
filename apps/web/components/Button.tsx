import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";
import { Loader } from "lucide-react";

type ButtonModes = 'primary' | 'logout' | 'indigo' | 'green' | 'red' | 'red-soft' | 'nav-button';

export function Button({ children, className, type = 'button', loading = false, loadingText = 'Loading...', mode = 'primary', ...rest }: { loading?: boolean, loadingText?: string, mode?: ButtonModes } & ButtonHTMLAttributes<HTMLButtonElement>) {
    const classes = {
        'primary': 'bg-primary !text-white py-4 hover:brightness-90 disabled:opacity-30 disabled:cursor-not-allowed',
        'logout': 'text-dark-indigo bg-blue-grey py-2',
        'indigo': '!text-white bg-indigo-700 py-2',
        'green': 'bg-emerald-600 !text-white py-2',
        'red': 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-[rgba(30,27,75,0.12)] transition-all active:scale-95',
        'red-soft': 'bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors',
        'nav-button': 'w-full justify-start rounded-xl p-3',
    };

    return (
        <button type={type} {...rest} className={cn(`transition-all px-4 rounded-full flex items-center justify-center gap-2 font-bold text-sm-clamp focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${loading && 'opacity-75 cursor-not-allowed'} ${classes[mode]}`, className)}>
            {loading && <Loader className="animate-spin" />}
            {loading ? loadingText : children}
        </button>
    );
}
