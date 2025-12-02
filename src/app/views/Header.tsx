import { Moon, Sun } from "lucide-react";
import { Button } from "@shared/components/ui";
import { useTheme } from "@shared/components/ui";

export default function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "light"
        : "dark";
      setTheme(systemTheme);
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header
      className="flex items-center h-[var(--header-height)] px-4 bg-background gap-4"
      id="header"
    >
      <div className="h-8 w-8">
        <img className="h-8 w-8 dark:invert" src="/vite.svg" alt="Vite logo" />
      </div>
      <h1 className="font-bold text-foreground flex-1">VITE</h1>
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  );
}
