import { useEffect, useRef } from "react";

interface Props {
  src: string;
  className?: string;
}

export default function HeroImageCanvas({ src, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const width = canvas.width;
      const height = canvas.height;

      // We flood-fill / replace outer background pixels starting from corners
      // Target website hero section background color: #f8efe8 -> RGB(248, 239, 232)
      const targetR = 248;
      const targetG = 239;
      const targetB = 232;

      // Flood fill queue starting from (0,0), (width-1, 0)
      const visited = new Uint8Array(width * height);
      const queue: number[] = [0, width - 1]; // top-left and top-right pixel indices
      visited[0] = 1;
      visited[width - 1] = 1;

      // Corner reference color
      const refR = data[0];
      const refG = data[1];
      const refB = data[2];

      let head = 0;
      while (head < queue.length) {
        const idx = queue[head++];
        const pixelPos = idx * 4;
        const pr = data[pixelPos];
        const pg = data[pixelPos + 1];
        const pb = data[pixelPos + 2];

        // Check color similarity to top corner background
        const colorDiff = Math.abs(pr - refR) + Math.abs(pg - refG) + Math.abs(pb - refB);

        if (colorDiff < 45) {
          // Replace outer background pixel with exact flat #f8efe8 color (or alpha 0)
          data[pixelPos] = targetR;
          data[pixelPos + 1] = targetG;
          data[pixelPos + 2] = targetB;
          data[pixelPos + 3] = 255; // or 0 for transparent

          const x = idx % width;
          const y = Math.floor(idx / width);

          // Neighbors (left, right, up, down)
          const neighbors = [];
          if (x > 0) neighbors.push(idx - 1);
          if (x < width - 1) neighbors.push(idx + 1);
          if (y > 0) neighbors.push(idx - width);
          if (y < height - 1) neighbors.push(idx + width);

          for (const n of neighbors) {
            if (!visited[n]) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }
      }

      ctx.putImageData(frame, 0, 0);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} />;
}
