interface YouTubeLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Official YouTube Play Button vector icon:
 * A red rounded rectangle (aspect ratio ~1.42:1) with a pure white centered play triangle.
 * Strictly avoids circular 360-degree shapes or inverted monochrome cutouts.
 */
export function YouTubeLogo({
  className = "w-12 h-[34px]",
  width,
  height,
}: YouTubeLogoProps) {
  return (
    <svg
      viewBox="0 0 68 48"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="YouTube"
      role="img"
    >
      {/* Official YouTube Red Rounded Rectangle (#FF0000) */}
      <path
        d="M66.52 7.74C65.74 4.86 63.46 2.58 60.58 1.82C55.36 0.4 34 0.4 34 0.4C34 0.4 12.64 0.4 7.42 1.82C4.54 2.58 2.26 4.86 1.48 7.74C0.06 12.96 0.06 24 0.06 24C0.06 24 0.06 35.04 1.48 40.26C2.26 43.14 4.54 45.42 7.42 46.18C12.64 47.6 34 47.6 34 47.6C34 47.6 55.36 47.6 60.58 46.18C63.46 45.42 65.74 43.14 66.52 40.26C67.94 35.04 67.94 24 67.94 24C67.94 24 67.94 12.96 66.52 7.74Z"
        fill="#FF0000"
      />
      {/* Official Pure White Centered Play Triangle */}
      <polygon points="27.2,34.2 44.8,24 27.2,13.8" fill="#FFFFFF" />
    </svg>
  );
}

