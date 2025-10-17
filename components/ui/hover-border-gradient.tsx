"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
    children,
    containerClassName,
    className,
    as: Tag = "button",
    duration = 1,
    clockwise = true,
    ...props
}: React.PropsWithChildren<
    {
        as?: React.ElementType;
        containerClassName?: string;
        className?: string;
        duration?: number;
        clockwise?: boolean;
    } & React.HTMLAttributes<HTMLElement>
>) {
    const [hovered, setHovered] = useState(false);
    const [direction, setDirection] = useState<Direction>("TOP");

    const rotateDirection = useCallback((current: Direction): Direction => {
        const dirs: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
        const i = dirs.indexOf(current);
        return clockwise ? dirs[(i - 1 + dirs.length) % dirs.length] : dirs[(i + 1) % dirs.length];
    }, [clockwise]);

    const movingMap: Record<Direction, string> = {
        TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
        LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
        BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
        RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
    };

    const highlight =
        "radial-gradient(75% 181.159% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

    useEffect(() => {
        if (!hovered) {
            const id = setInterval(() => setDirection((d) => rotateDirection(d)), duration * 1000);
            return () => clearInterval(id);
        }
    }, [hovered, duration, clockwise, rotateDirection]);

    return (
        <Tag
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "relative flex rounded-full border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col gap-10 h-min justify-center overflow-visible p-px w-fit",
                containerClassName
            )}
            {...props}
        >
            <div className={cn("w-auto text-white z-10 bg-black px-4 py-2 rounded-[inherit]", className)}>
                {children}
            </div>
            <motion.div
                className={cn("flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]")}
                style={{ filter: "blur(2px)", position: "absolute", width: "100%", height: "100%" }}
                initial={{ background: movingMap[direction] }}
                animate={{ background: hovered ? [movingMap[direction], highlight] : movingMap[direction] }}
                transition={{ ease: "linear", duration: duration ?? 1 }}
            />
            <div className="bg-black absolute z-1 flex-none inset-[2px] rounded-[100px]" />
        </Tag>
    );
}
