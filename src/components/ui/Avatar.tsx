import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const dotSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string) {
  const colors = [
    "bg-accent-hangout",
    "bg-accent-event",
    "bg-accent-bracket",
    "bg-accent-senpai",
    "bg-accent-action",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, url, size = "md", online }: AvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      {url ? (
        <img
          src={url}
          alt={name}
          className={cn(
            "rounded-full object-cover",
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-semibold text-bg-primary",
            sizeClasses[size],
            getColor(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-bg-primary",
            dotSizes[size],
            online ? "bg-accent-hangout" : "bg-text-tertiary"
          )}
        />
      )}
    </div>
  );
}
