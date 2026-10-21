/**
 * Shape returned by every server action. Actions never call `redirect()` / `revalidatePath()`;
 * the client (see `useFormAction`) refreshes or navigates instead. This sidesteps a React 19
 * production race in Next 15.5 where action transitions that carry a re-rendered RSC tree
 * intermittently never commit (useActionState stuck pending).
 */
export type ActionResult = {
  error?: string;
  success?: string;
  /** Navigate here after success. Absolute URLs (e.g. Stripe Checkout) use a full page load. */
  redirectTo?: string;
  /** Force a full page load, e.g. after sign-in/out so server-rendered session UI updates. */
  hardRedirect?: boolean;
  ticketId?: string;
};
