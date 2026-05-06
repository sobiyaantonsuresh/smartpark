import { cn } from "@/lib/utils";
import type { Slot } from "@/store/parking";
import { Car } from "lucide-react";

const statusStyles: Record<Slot["status"], string> = {
  available: "bg-success/15 border-success/40 text-success hover:bg-success/25",
  occupied: "bg-destructive/15 border-destructive/50 text-destructive slot-pulse-occupied",
  reserved: "bg-warning/15 border-warning/50 text-warning",
};

export function SlotCell({
  slot,
  onClick,
  selected,
}: {
  slot: Slot;
  onClick?: () => void;
  selected?: boolean;
}) {
  const clickable = slot.status === "available" && !!onClick;
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        "group relative flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-all duration-300",
        statusStyles[slot.status],
        clickable && "cursor-pointer hover:scale-105 hover:glow",
        !clickable && slot.status === "available" && "cursor-default",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105",
      )}
      title={`${slot.id} · ${slot.status}`}
    >
      {slot.status === "occupied" ? (
        <Car className="h-5 w-5" />
      ) : (
        <span className="text-[10px] font-medium opacity-70">P</span>
      )}
      <span className="text-[11px] font-bold leading-none">{slot.id.split("-")[1]}</span>
    </button>
  );
}
