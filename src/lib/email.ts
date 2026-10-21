import "server-only";
import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "LazerLayer <orders@lazerlayer.com>";

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs to the server console. */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await new Resend(key).emails.send({ from, to, subject, text });
  } catch (err) {
    console.error("[email] failed to send", err);
  }
}
