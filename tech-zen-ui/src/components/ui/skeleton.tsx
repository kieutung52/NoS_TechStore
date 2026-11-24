import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Vệt sáng quét ngang (shimmer) thay cho nhấp nháy
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70 before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
