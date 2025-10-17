"use client";
import * as React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClick: () => Promise<unknown> | void;
    successText?: string;
    loadingText?: string;
    errorText?: string;
};

export function Button({
    onClick,
    successText = "انجام شد",
    loadingText = "در حال ارسال...",
    errorText = "خطا",
    className,
    children,
    ...rest
}: Props) {
    const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle");

    const handle = async () => {
        try {
            const r = onClick?.();
            if (r && typeof (r as Promise<unknown>).then === "function") {
                setState("loading");
                await r;
                setState("success");
                setTimeout(() => setState("idle"), 1200);
            }
        } catch {
            setState("error");
            setTimeout(() => setState("idle"), 1500);
        }
    };

    return (
        <button
            type="button"
            onClick={handle}
            disabled={state === "loading" || rest.disabled}
            className={clsx(
                // رنگ آبی فعلی پروژه را حفظ کن؛ در صورت داشتن کلاس سفارشی به‌جای این‌ها بگذار.
                "px-4 py-2 rounded-xl inline-flex items-center justify-center gap-2 transition-colors",
                "bg-blue-600 text-white hover:bg-blue-600/95",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                className
            )}
            {...rest}
        >
            {state === "loading" && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            )}
            <span>
                {state === "idle" && children}
                {state === "loading" && loadingText}
                {state === "success" && successText}
                {state === "error" && errorText}
            </span>
        </button>
    );
}
