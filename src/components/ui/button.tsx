import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-medium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-emerald to-success text-cream font-bold shadow-medium hover:shadow-large hover:scale-[1.02] transition-all duration-300",
        teamAline: "bg-emerald text-cream font-bold shadow-soft hover:shadow-medium hover:bg-emerald/90 border-2 border-transparent data-[selected=true]:border-cream data-[selected=true]:ring-2 data-[selected=true]:ring-cream",
        teamAdelino: "bg-warning text-cream font-bold shadow-soft hover:shadow-medium hover:bg-warning/90 border-2 border-transparent data-[selected=true]:border-cream data-[selected=true]:ring-2 data-[selected=true]:ring-cream",
        quiz: "bg-card text-card-foreground border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left justify-start h-auto py-4 px-4",
        quizSelected: "bg-primary text-primary-foreground border-2 border-primary shadow-medium text-left justify-start h-auto py-4 px-4",
        quizCorrect: "bg-success text-cream border-2 border-success shadow-medium text-left justify-start h-auto py-4 px-4",
        quizWrong: "bg-destructive text-destructive-foreground border-2 border-destructive shadow-medium text-left justify-start h-auto py-4 px-4",
        start: "bg-gradient-to-r from-success to-emerald text-cream font-bold text-lg shadow-large hover:shadow-glow animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        full: "w-full h-12 rounded-lg px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };