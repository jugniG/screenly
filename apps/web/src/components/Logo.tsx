interface LogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  /** Off for tight placements where the surrounding copy already says Screenly. */
  showWordmark?: boolean;
}

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

const pixelSize = { sm: 32, md: 40, lg: 48 };

/**
 * The one brand mark on the site. It renders the app icon rather than a
 * redrawn SVG, because that icon is what already ships on the user's home
 * screen and in Play — any separate web drawing drifts from it the moment the
 * app icon is updated.
 *
 * Regenerate public/logo-256.png with `node scripts/build-favicons.mjs` after
 * changing apps/android_app/assets/images/icon.png.
 */
export function Logo({
  className = "",
  iconSize = "md",
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={`flex select-none items-center gap-2.5 ${className}`}>
      <img
        src="/logo-256.png"
        alt="Screenly"
        width={pixelSize[iconSize]}
        height={pixelSize[iconSize]}
        className={`${sizeClasses[iconSize]} shrink-0 rounded-xl`}
      />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          Screenly
        </span>
      )}
    </span>
  );
}