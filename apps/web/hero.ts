// hero.ts
import { heroui } from "@heroui/react";
export default heroui({
  defaultTheme: "light",
  themes: {
    light: {
      colors: {
        background: "#F4F5F8",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#FE6401",
          foreground: "#FFFFFF",
        },
        content1: "#FFFFFF",
        content2: "#F4F5F8",
      },
    },
  },
});