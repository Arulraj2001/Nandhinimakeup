"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Hook to prompt user before leaving a page when form has unsaved changes.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}

/**
 * Submit button with loading state that prevents double submission.
 */
export interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingLabel?: string;
  label?: string;
}

export function SubmitButton({
  isLoading = false,
  loadingLabel = "Saving...",
  label = "Save Changes",
  children,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading ? loadingLabel : children || label}
    </Button>
  );
}

/**
 * Form field wrapper with label and error message display.
 */
interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
  className = "space-y-1.5",
}: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-foreground/70 text-xs">{hint}</p>}
      {error && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
