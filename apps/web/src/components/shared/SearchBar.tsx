/**
 * File: SearchBar.tsx
 * Purpose: App search form: one input, one "Get the guide" button, inline length check.
 * Exports: SearchBar
 * Used by: Landing, App home, Not found
 */
import { useId, useState, type FormEvent, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  onSubmit: (app: string) => void;
  size?: "md" | "lg";
  /** `secondary` when another button on the page is the red primary action. */
  buttonVariant?: "primary" | "secondary";
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

const MIN_LENGTH = 2; // Same bound as POST /api/runs in docs/api-design.md.
const MAX_LENGTH = 100;

/** Presentational: the page decides what a submit does. */
export function SearchBar({
  onSubmit,
  size = "md",
  buttonVariant = "primary",
  defaultValue = "",
  placeholder = "App name or website",
  className,
}: SearchBarProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const app = value.trim();
    if (app.length < MIN_LENGTH) {
      setError(
        `The app name is too short. Enter at least ${MIN_LENGTH} characters.`,
      );
      return;
    }
    setError(null);
    onSubmit(app);
  }

  return (
    <form
      role="search"
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-2", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        App name or website
      </label>
      <div className="flex flex-col gap-2 tablet:flex-row">
        <Input
          id={inputId}
          name="app"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={size === "lg" ? "h-12" : undefined}
        />
        <Button
          type="submit"
          variant={buttonVariant}
          size={size}
          className="tablet:shrink-0"
        >
          Get the guide
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-small text-ink">
          {error}
        </p>
      )}
    </form>
  );
}
