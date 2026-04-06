import { cva } from"class-variance-authority"

export const buttonVariants = cva(
"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
 {
 variants: {
  variant: {
  default:"bg-primary text-primary-foreground [a]:hover:bg-primary/80",
  outline:
 "border-border bg-background hover:bg-muted aria-expanded:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary:
 "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
  ghost:"hover:bg-muted aria-expanded:bg-muted dark:hover:bg-muted/50",
  destructive:
 "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
  link:"text-primary underline-offset-4 hover:underline",
  },
  size: {
  default:"h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 text-base",
  xs:"h-7 gap-1 rounded-md px-2",
  sm:"h-9 gap-1.5 rounded-md px-3 text-[15px]",
  lg:"h-11 gap-2 px-6 text-lg",
  icon:"size-10",
 "icon-xs":"size-7 rounded-md",
 "icon-sm":"size-9 rounded-md",
 "icon-lg":"size-11",
  },
 },
 defaultVariants: {
  variant:"default",
  size:"default",
 },
 }
)
