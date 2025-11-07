"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { asChild?: boolean; }
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ asChild, className, ...props }, ref)=>{
  const Comp = asChild ? (Slot as any) : "span";
  return <Comp ref={ref} className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-[--border] bg-[--bg]/10 backdrop-blur", className)} {...props}/>;
});
Badge.displayName="Badge";
