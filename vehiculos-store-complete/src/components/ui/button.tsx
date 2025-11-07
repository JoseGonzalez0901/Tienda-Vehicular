"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

type Variant = "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { asChild?: boolean; variant?: Variant; size?: Size; }
export function buttonVariants({ variant = "default", size = "md", className, }:{ variant?: Variant; size?: Size; className?: string } = {}){
  const base="inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--primary] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<Variant,string> = {
    default:"bg-[--primary] text-[--primary-contrast] hover:bg-[--primary]/90",
    outline:"border border-[--border] bg-[--bg] text-[--text] hover:bg-[--surface]/80",
    ghost:"bg-transparent hover:bg-[--surface]/70",
    link:"bg-transparent text-[--primary] underline-offset-4 hover:underline",
    secondary:"bg-[--surface] text-[--text] hover:bg-[--surface]/80",
    destructive:"bg-red-600 text-white hover:bg-red-600/90",
  };
  const sizes: Record<Size,string> = { sm:"h-8 px-3 text-sm", md:"h-10 px-4 text-sm", lg:"h-12 px-5 text-base", icon:"h-10 w-10 p-0" };
  return cn(base, variants[variant], sizes[size], className);
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, className, variant="default", size="md", ...props }, ref)=>{
  const Comp = asChild ? (Slot as any) : "button";
  return <Comp ref={ref} className={buttonVariants({variant,size,className})} {...props}/>;
});
Button.displayName="Button";
