"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface SegmentedControlProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /**
     * Options to render in the segmented control.
     */
    options: SegmentedControlOption[];
    /**
     * Currently selected value (controlled).
     */
    value: string;
    /**
     * Change handler – called with the new value when the user selects an option.
     */
    onChange: (value: string) => void;
    /**
     * If true, stretches to fill available width.
     */
    fullWidth?: boolean;
}

function useSliderPosition(
    containerRef: React.RefObject<HTMLDivElement>,
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
    activeIndex: number
) {
    const [sliderWidth, setSliderWidth] = React.useState<number | undefined>(undefined);
    const [sliderTranslateX, setSliderTranslateX] = React.useState<number | undefined>(undefined);

    const updateIndicator = React.useCallback(() => {
        const containerEl = containerRef.current;
        if (!containerEl) {
            setSliderWidth(undefined);
            setSliderTranslateX(undefined);
            return;
        }

        const buttons = buttonRefs.current;
        const activeButton = buttons[activeIndex];
        if (!activeButton) {
            setSliderWidth(undefined);
            setSliderTranslateX(undefined);
            return;
        }

        const containerRect = containerEl.getBoundingClientRect();
        const activeRect = activeButton.getBoundingClientRect();
        const left = activeRect.left - containerRect.left;

        setSliderWidth(activeRect.width);
        setSliderTranslateX(left);
    }, [activeIndex, containerRef, buttonRefs]);

    React.useLayoutEffect(() => {
        updateIndicator();

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const containerEl = containerRef.current;
        if (!containerEl) return;

        const resizeObserver = new ResizeObserver(() => {
            updateIndicator();
        });

        resizeObserver.observe(containerEl);

        return () => {
            resizeObserver.disconnect();
        };
    }, [updateIndicator]);

    return { sliderWidth, sliderTranslateX };
}

function useKeyboardNavigation(
    options: SegmentedControlOption[],
    activeIndex: number,
    onChange: (value: string) => void,
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
) {
    return React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                return;
            }

            event.preventDefault();

            if (options.length === 0) return;

            let nextIndex = activeIndex;

            if (event.key === "ArrowLeft") {
                nextIndex = activeIndex === 0 ? options.length - 1 : activeIndex - 1;
            } else if (event.key === "ArrowRight") {
                nextIndex = activeIndex === options.length - 1 ? 0 : activeIndex + 1;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = options.length - 1;
            }

            const nextOption = options[nextIndex];
            if (!nextOption) return;

            onChange(nextOption.value);

            const btn = buttonRefs.current[nextIndex];
            if (btn) {
                btn.focus();
            }
        },
        [options, activeIndex, onChange, buttonRefs]
    );
}

function SlidingIndicator({ style }: { style: React.CSSProperties }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-y-1 rounded-xl",
                "bg-background/80 shadow-[0_8px_30px_rgba(0,0,0,0.10)]",
                "transition-[transform,width] duration-200 ease-out will-change-[transform,width]"
            )}
            style={style}
        />
    );
}

function SegmentedButton({
    option,
    index,
    isActive,
    buttonRefs,
    onClick,
}: {
    option: SegmentedControlOption;
    index: number;
    isActive: boolean;
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
    onClick: () => void;
}) {
    return (
        <button
            ref={(el) => {
                buttonRefs.current[index] = el;
            }}
            type="button"
            data-segmented-option
            role="tab"
            aria-selected={isActive}
            aria-label={option.label}
            tabIndex={isActive ? 0 : -1}
            className={cn(
                "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 font-medium outline-none sm:px-4",
                "transition-all duration-150",
                "text-muted-foreground/80",
                "hover:brightness-105 active:scale-[0.98]",
                "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive && "text-primary-foreground"
            )}
            onClick={onClick}
        >
            {option.icon && (
                <span
                    className={cn(
                        "inline-flex h-4 w-4 items-center justify-center sm:h-4 sm:w-4",
                        isActive ? "opacity-100" : "opacity-80"
                    )}
                    aria-hidden="true"
                >
                    {option.icon}
                </span>
            )}
            <span className="truncate">{option.label}</span>
        </button>
    );
}

function useSegmentedControlState(
    options: SegmentedControlOption[],
    value: string,
    onChange: (value: string) => void
) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const activeIndexRaw = options.findIndex((opt) => opt.value === value);
    const activeIndex = activeIndexRaw === -1 ? 0 : activeIndexRaw;

    const { sliderWidth, sliderTranslateX } = useSliderPosition(
        containerRef,
        buttonRefs,
        activeIndex
    );

    const handleKeyDown = useKeyboardNavigation(
        options,
        activeIndex,
        onChange,
        buttonRefs
    );

    const handleClick = React.useCallback(
        (option: SegmentedControlOption) => {
            if (option.value === value) return;
            onChange(option.value);
        },
        [value, onChange]
    );

    const indicatorStyle: React.CSSProperties | undefined =
        sliderWidth !== undefined && sliderTranslateX !== undefined
            ? {
                width: `${sliderWidth}px`,
                transform: `translateX(${sliderTranslateX}px)`,
            }
            : undefined;

    return {
        containerRef,
        buttonRefs,
        handleKeyDown,
        handleClick,
        indicatorStyle,
    };
}

/**
 * SegmentedControl
 *
 * Premium, glassy segmented control with:
 * - Sliding animated indicator
 * - Full keyboard support (arrow keys, Home/End)
 * - Accessible roles (tablist / tab)
 * - Optional icons per option
 *
 * Used e.g. in AdoptionMarketplaceView for "Browse / My Listings / Applications".
 */
export function SegmentedControl(props: SegmentedControlProps) {
    const {
        options,
        value,
        onChange,
        fullWidth,
        className,
        role,
        ...rest
    } = props;

    const {
        containerRef,
        buttonRefs,
        handleKeyDown,
        handleClick,
        indicatorStyle,
    } = useSegmentedControlState(options, value, onChange);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/40 px-1 py-1 text-xs shadow-sm backdrop-blur-xl sm:text-sm",
                fullWidth && "w-full",
                className
            )}
            role={role ?? "tablist"}
            aria-orientation="horizontal"
            onKeyDown={handleKeyDown}
            {...rest}
        >
            {indicatorStyle && <SlidingIndicator style={indicatorStyle} />}
            <div className="relative z-10 flex w-full items-center justify-between gap-1">
                {options.map((option, index) => (
                    <SegmentedButton
                        key={option.value}
                        option={option}
                        index={index}
                        isActive={option.value === value}
                        buttonRefs={buttonRefs}
                        onClick={() => handleClick(option)}
                    />
                ))}
            </div>
        </div>
    );
}
