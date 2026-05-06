import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SlotCell } from "@/components/SlotCell";
import { useParking } from "@/store/parking";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/slots")({
  head: () => ({ meta: [{ title: "Live slots · SmartPark" }] }),
  component: AdminSlots,
});

function AdminSlots() {
  useLiveSimulation();
  const slots = useParking((s) => s.slots);
  const addSlot = useParking((s) => s.addSlot);
  const removeSlot = useParking((s) => s.removeSlot);

  const [newFloor, setNewFloor] = useState("1");
  const [newZone, setNewZone] = useState("A");
  const [removeId, setRemoveId] = useState("");

  const grouped = useMemo(() => {
    const m = new Map<string, typeof slots>();
    for (const s of slots) {
      const k = `Floor ${s.floor} · Zone ${s.zone}`;
      if (!m.has(k)) m.set(k, [] as typeof slots);
      m.get(k)!.push(s);
    }
    return Array.from(m.entries());
  }, [slots]);

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Slot Monitor</h1>
          <p className="text-sm text-muted-foreground">All slots across the facility, updating live.</p>
        </div>
      </div>

      <Card className="glass-card mb-6 border-0 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Floor</label>
            <Input
              className="w-20"
              type="number"
              min={1}
              value={newFloor}
              onChange={(e) => setNewFloor(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Zone</label>
            <Input
              className="w-20"
              maxLength={2}
              value={newZone}
              onChange={(e) => setNewZone(e.target.value.toUpperCase())}
            />
          </div>
          <Button
            onClick={() => {
              const f = parseInt(newFloor, 10);
              if (!f || !newZone) return toast.error("Invalid floor/zone");
              addSlot(f, newZone);
              toast.success("Slot added");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add slot
          </Button>

          <div className="ml-auto flex items-end gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Remove by ID</label>
              <Input
                className="w-40"
                placeholder="e.g. F1-A05"
                value={removeId}
                onChange={(e) => setRemoveId(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (!slots.find((s) => s.id === removeId)) return toast.error("No such slot");
                removeSlot(removeId);
                toast.success(`Removed ${removeId}`);
                setRemoveId("");
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {grouped.map(([title, items]) => (
          <Card key={title} className="glass-card border-0 p-4">
            <div className="mb-3 text-sm font-medium">{title}</div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-12">
              {items.map((slot) => (
                <SlotCell key={slot.id} slot={slot} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
