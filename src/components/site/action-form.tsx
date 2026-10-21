"use client";

import { createContext, useCallback, useContext, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

export const FormPendingContext = createContext(false);
export const useFormPending = () => useContext(FormPendingContext);

type Options = {
  confirm?: string;
  toastSuccess?: boolean;
  toastError?: boolean;
  resetOnSuccess?: boolean;
  refresh?: boolean;
};

/** Submits a form to a server action from an event handler and applies the returned ActionResult. */
export function useFormAction(
  action: (formData: FormData) => Promise<ActionResult | void>,
  { confirm, toastSuccess, toastError, resetOnSuccess, refresh = true }: Options = {},
) {
  const router = useRouter();
  const [state, setState] = useState<ActionResult | undefined>();
  const [pending, setPending] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (pending) return;
      if (confirm && !window.confirm(confirm)) return;
      const form = e.currentTarget;
      setPending(true);
      let result: ActionResult | undefined;
      try {
        result = (await action(new FormData(form))) ?? {};
      } catch (err) {
        console.error(err);
        result = { error: "Something went wrong. Please try again." };
      }
      setState(result);

      if (result.error) {
        if (toastError) toast.error(result.error);
        setPending(false);
        return;
      }
      if (result.success && toastSuccess) toast.success(result.success);
      if (resetOnSuccess) form.reset();

      if (result.redirectTo) {
        if (result.hardRedirect || /^https?:\/\//.test(result.redirectTo)) window.location.assign(result.redirectTo);
        else router.push(result.redirectTo);
        return;
      }
      if (refresh) router.refresh();
      setPending(false);
    },
    [action, confirm, pending, refresh, resetOnSuccess, router, toastError, toastSuccess],
  );

  return { state, pending, onSubmit };
}

export function ActionForm({
  action,
  children,
  className,
  ...options
}: Options & {
  action: (formData: FormData) => Promise<ActionResult | void>;
  children: React.ReactNode;
  className?: string;
}) {
  const { pending, onSubmit } = useFormAction(action, { toastError: true, toastSuccess: true, ...options });
  return (
    <FormPendingContext.Provider value={pending}>
      <form onSubmit={onSubmit} className={className}>
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}
