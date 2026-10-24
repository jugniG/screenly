interface LogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  /** Off for tight placements where the surrounding copy already says Screenly. */
  showWordmark?: boolean;
  /** For dark surfaces, where the wordmark needs to invert to cream. */
  light?: boolean;
}

const iconPx = { sm: 26, md: 32, lg: 40 } as const;
const wordmarkPx = { sm: 20, md: 24, lg: 30 } as const;

/**
 * The Open S mark — a lime S with a darker terminal, on a forest rounded
 * square. Master art is public/images/screenly-logo.svg; the favicon set and
 * app/touch icons come from the same file, so the tab icon, the Play listing
 * and the nav can never drift apart.
 */
export function Logo({
  className = "",
  iconSize = "md",
  showWordmark = true,
  light = false,
}: LogoProps) {
  return (
    <span className={`logo ${light ? "light" : ""} ${className}`}>
      <img
        src="/images/screenly-logo.svg"
        alt=""
        width={iconPx[iconSize]}
        height={iconPx[iconSize]}
        className="shrink-0"
      />
      {showWordmark && (
        <span style={{ fontSize: `${wordmarkPx[iconSize]}px` }}>
          screenly<span className="logo-dot">.</span>
        </span>
      )}
    </span>
  );
}