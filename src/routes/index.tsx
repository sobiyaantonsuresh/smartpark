import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SlotCell } from "@/components/SlotCell";
import { useParking } from "@/store/parking";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Car, MapPin, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartPark — Find & book parking in real time" },
      {
        name: "description",
        content:
          "Live parking availability, instant booking and QR-based entry/exit. Smart parking made simple.",
      },
      { property: "og:title", content: "SmartPark — Smart Parking System" },
      {
        property: "og:description",
        content: "Find a spot, book it, scan in. Real-time parking management.",
      },
    ],
  }),
  component: DriverHome,
});

function DriverHome() {
  useLiveSimulation();
  const slots = useParking((s) => s.slots);
  const selectedFloor = useParking((s) => s.selectedFloor);
  const setFloor = useParking((s) => s.setFloor);
  const bookSlot = useParking((s) => s.bookSlot);
  const navigate = Route.useNavigate();

  const [picked, setPicked] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [name, setName] = useState("");

  const floors = useMemo(() => Array.from(new Set(slots.map((s) => s.floor))).sort(), [slots]);
  const filtered = selectedFloor === "all" ? slots : slots.filter((s) => s.floor === selectedFloor);
  const stats = useMemo(() => {
    const a = slots.filter((s) => s.status === "available").length;
    const o = slots.filter((s) => s.status === "occupied").length;
    const r = slots.filter((s) => s.status === "reserved").length;
    return { a, o, r, total: slots.length };
  }, [slots]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const s of filtered) {
      const k = `F${s.floor} · Zone ${s.zone}`;
      if (!map.has(k)) map.set(k, [] as typeof filtered);
      map.get(k)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleBook = () => {
    if (!picked) return toast.error("Pick an available slot first");
    if (plate.trim().length < 3) return toast.error("Enter a valid plate number");
    if (name.trim().length < 2) return toast.error("Enter your name");
    const b = bookSlot(picked, plate.trim(), name.trim());
    toast.success(`Slot ${picked} reserved`);
    navigate({ to: "/booking/$id", params: { id: b.id } });
  };

  return (
    <Layout>
      <section className="mb-6">
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">Real-time availability</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Find your <span className="text-gradient">perfect spot</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Live parking slots updated every few seconds. Pick a green slot, enter your plate,
                and get a QR code for instant entry.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Available" value={stats.a} color="text-success" />
              <Stat label="Reserved" value={stats.r} color="text-warning" />
              <Stat label="Occupied" value={stats.o} color="text-destructive" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={selectedFloor === "all" ? "default" : "outline"}
              onClick={() => setFloor("all")}
            >
              All floors
            </Button>
            {floors.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={selectedFloor === f ? "default" : "outline"}
                onClick={() => setFloor(f)}
              >
                Floor {f}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <Legend color="bg-success" label="Available" />
              <Legend color="bg-warning" label="Reserved" />
              <Legend color="bg-destructive" label="Occupied" />
            </div>
          </div>

          <div className="space-y-5">
            {grouped.map(([title, items]) => (
              <Card key={title} className="glass-card border-0 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {title}
                </div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {items.map((slot) => (
                    <SlotCell
                      key={slot.id}
                      slot={slot}
                      selected={picked === slot.id}
                      onClick={() => setPicked(slot.id)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="glass-card border-0 p-5">
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <Car className="h-4 w-4 text-primary" /> Book this slot
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {picked ? `Selected: ${picked}` : "Tap a green slot on the grid"}
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="plate" className="text-xs">License plate</Label>
                <Input
                  id="plate"
                  placeholder="e.g. ABC-1234"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  maxLength={12}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Driver name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <Button className="w-full glow" disabled={!picked} onClick={handleBook}>
                Reserve & generate QR
              </Button>
              <Link
                to="/bookings"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                View my bookings →
              </Link>
            </div>
          </Card>

          <Card className="glass-card border-0 p-5">
            <h3 className="mb-2 text-sm font-semibold">How it works</h3>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li>1. Pick an available (green) slot</li>
              <li>2. Enter plate + name to reserve</li>
              <li>3. Show QR at entry gate to check in</li>
              <li>4. Scan again on exit — pay automatically</li>
            </ol>
          </Card>
        </aside>
      </div>
    </Layout>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-4 py-2 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
