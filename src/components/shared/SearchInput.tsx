import { forwardRef, type InputHTMLAttributes } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Full-width search field: --bg-raised, borderless until focus, then
 * --border-default. Border is always present but transparent to avoid
 * layout shift on focus.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        spellCheck={false}
        autoComplete="off"
        className={`w-full px-2.5 py-1.5 text-[13px] outline-none transition-colors placeholder:text-[var(--text-muted)] ${className}`}
        style={{
          backgroundColor: "var(--bg-raised)",
          color: "var(--text-primary)",
          border: "1px solid transparent",
          borderRadius: 4,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--border-default)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "transparent";
          props.onBlur?.(e);
        }}
        {...props}
      />
    );
  },
);

SearchInput.displayName = "SearchInput";
