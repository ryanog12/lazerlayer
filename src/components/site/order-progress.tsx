import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return <p className="text-sm text-muted-foreground">This order was cancelled.</p>;
  }
  const current = ORDER_STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-2">
      {ORDER_STATUS_FLOW.map((step, i) => (
        <li key={step} className="flex flex-col items-center gap-2 text-center">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
              i < current && "border-primary bg-primary text-primary-foreground",
              i === current && "border-primary text-primary",
              i > current && "border-muted text-muted-foreground",
            )}
          >
            {i < current ? <Check className="size-4" /> : i + 1}
          </span>
          <span className={cn("text-xs", i <= current ? "font-medium" : "text-muted-foreground")}>
            {ORDER_STATUS_LABEL[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}
