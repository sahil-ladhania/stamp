/**
 * File: StartRunSearch.tsx
 * Purpose: The one search box that starts a run: it calls the start-run flow, opens the cached guide or the live run,
 *          and shows the wait, the failure or the paused notice under the box.
 * Exports: StartRunSearch
 * Used by: App home, Landing and Not found pages
 */
import { useState, type ReactElement } from "react";
import { useStartRun } from "@/hooks/useStartRun";
import { cn } from "@/lib/utils";
import { getSearchMessage } from "@/utils/search-message";
import { PausedNotice } from "./PausedNotice";
import { SearchBar, type SearchBarProps } from "./SearchBar";

type StartRunSearchProps = Omit<SearchBarProps, "onSubmit" | "isPending">;

export function StartRunSearch({
  className,
  ...searchProps
}: StartRunSearchProps): ReactElement {
  const { start, isPending, error } = useStartRun();
  const [app, setApp] = useState("");
  const message = getSearchMessage({ isPending, app, error });

  function handleSubmit(value: string): void {
    setApp(value);
    void start(value);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {error?.code === "RUN_CAP_REACHED" && <PausedNotice />}
      <SearchBar
        {...searchProps}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
      {/* Always rendered so screen readers announce the text when it appears. */}
      <p role="status" className={message ? "text-small text-ink" : "sr-only"}>
        {message}
      </p>
    </div>
  );
}
