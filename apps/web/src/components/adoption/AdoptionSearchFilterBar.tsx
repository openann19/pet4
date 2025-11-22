"use client";

import * as React from "react";
import { Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdoptionSearchFilterBarProps {
    loading: boolean;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    activeFilterCount: number;
    onToggleFilters: () => void;
}

export function AdoptionSearchFilterBar({
    loading,
    searchQuery,
    onSearchChange,
    activeFilterCount,
    onToggleFilters,
}: AdoptionSearchFilterBarProps) {
    const hasFilters = activeFilterCount > 0;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-background/40 to-background/95 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-4 sm:py-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_60%)] opacity-60" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/70">
                            <MagnifyingGlass className="h-4 w-4" />
                        </span>
                        <Input
                            value={searchQuery}
                            disabled={loading}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Search by name, breed, location, or traits"
                            className={cn(
                                "h-11 rounded-xl border-none bg-background/60 pl-9 text-sm shadow-[0_0_0_1px_rgba(148,163,184,0.35)] transition-shadow",
                                "focus-visible:shadow-[0_0_0_1px_rgba(96,165,250,0.8),0_0_0_1px_rgba(15,23,42,0.8)]"
                            )}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={onToggleFilters}
                        className={cn(
                            "group inline-flex items-center gap-2 rounded-full border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary shadow-[0_10px_25px_rgba(15,23,42,0.55)] transition-all",
                            "hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 hover:text-primary-foreground",
                            "active:scale-[0.98] active:translate-y-0"
                        )}
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/40">
                            <Funnel className="h-3.5 w-3.5" />
                        </span>
                        <span>Filters</span>
                        {hasFilters && (
                            <Badge className="ml-1 rounded-full bg-background/80 px-2 text-[11px] font-semibold text-foreground">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
