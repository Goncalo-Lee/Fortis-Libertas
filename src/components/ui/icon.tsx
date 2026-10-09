import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconVariants = cva(
  "stroke-current hover:stroke-current hover:fill-current active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "text-primary fill-current",
        secondary: "text-secondary-muted fill-current",
      },
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type IconProps = React.ComponentProps<"svg"> &
  VariantProps<typeof iconVariants>;

export function Icon({ className, variant, size, ...props }: IconProps) {
  return (
    <svg
      className={cn(iconVariants({ variant, size }), className)}
      {...props}
    />
  );
}
