import { useId } from "react";

interface LogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "w-9 h-9",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const svgSizes = {
  sm: 20,
  md: 26,
  lg: 32,
};

export function Logo({
  className = "",
  iconSize = "md",
  showTagline = false,
}: LogoProps) {
  const id = useId();
  const topId = `glass-grad-top-${id}`;
  const bottomId = `glass-grad-bottom-${id}`;
  const strokeId = `stroke-grad-${id}`;
  const svgSize = svgSizes[iconSize];

  return (
    <a
      href="/"
      className={`flex items-center gap-3 select-none ${className}`}
      aria-label="Screenly home"
    >
      <div className="relative group">
        <div
          className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-logo-glow blur opacity-25 transition duration-1000 group-hover:opacity-40"
          aria-hidden="true"
        />
        <div
          className={`relative flex items-center justify-center rounded-full bg-ink shadow-2xl border border-foreground/10 ${sizeClasses[iconSize]}`}
        >
          <svg
            width={svgSize}
            height={svgSize + 4}
            viewBox="0 0 28 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
            aria-hidden="true"
          >
            <path
              d="M4 2C4 2 4 10 14 14C24 10 24 2 24 2H4Z"
              fill={`url(#${topId})`}
              stroke={`url(#${strokeId})`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M4 30C4 30 4 22 14 18C24 22 24 30 24 30H4Z"
              fill={`url(#${bottomId})`}
              stroke={`url(#${strokeId})`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle
              cx="14"
              cy="16"
              r="1.5"
              className="fill-primary animate-pulse"
            />
            <defs>
              <linearGradient
                id={topId}
                x1="14"
                y1="2"
                x2="14"
                y2="14"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--primary)" />
                <stop
                  offset="1"
                  stopColor="var(--primary)"
                  stopOpacity="0.4"
                />
              </linearGradient>
              <linearGradient
                id={bottomId}
                x1="14"
                y1="18"
                x2="14"
                y2="30"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--primary)" />
                <stop offset="1" stopColor="var(--logo-glow)" />
              </linearGradient>
              <linearGradient
                id={strokeId}
                x1="4"
                y1="2"
                x2="24"
                y2="30"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--primary-foreground)" />
                <stop offset="1" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <span
          className="font-semibold tracking-tight text-foreground flex items-baseline"
          style={{ fontFamily: "Urbanist, sans-serif" }}
        >
          Screenly
          <span className="h-1.5 w-1.5 rounded-full bg-primary ml-1.5 mb-1 shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_50%,transparent)]" />
        </span>
        {showTagline && (
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mt-0.5 pl-0.5"
            style={{ fontFamily: "Urbanist, sans-serif" }}
          >
            Wellness First
          </span>
        )}
      </div>
    </a>
  );
}
