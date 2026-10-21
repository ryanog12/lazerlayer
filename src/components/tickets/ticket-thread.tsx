import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
};

export function TicketThread({ messages, viewer }: { messages: Message[]; viewer: "customer" | "admin" }) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = viewer === "admin" ? m.isStaff : !m.isStaff;
        return (
          <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl border px-4 py-3 text-sm",
                m.isStaff ? "border-primary/30 bg-primary/5" : "bg-card",
              )}
            >
              <p className="mb-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {m.isStaff ? "LazerLayer support" : (m.author?.name ?? m.author?.email ?? "Customer")}
                </span>{" "}
                · {formatDate(m.createdAt)}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
