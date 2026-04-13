import { cn } from"@/lib/utils";

type SectionProps = {
 children: React.ReactNode;
 className?: string;
};

export function Section({ children, className }: SectionProps) {
 return <section className={cn("pt-10 lg:pt-15 2 xl:pt-20", className)}>{children}</section>;
}

export function SectionContainer({ children, className }: SectionProps) {
 return <div className={cn("container mx-auto px-4", className)}>{children}</div>;
}
