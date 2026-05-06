import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Car,
  CircleDollarSign,
  ParkingCircle,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard · SmartPark" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  useLiveSimulation();
  const slots = useParking((s) => s.slots);
  const bookings = useParking((s) => s.bookings);
  const logs = useParking((s) => s.logs);

  const stats = useMemo(() => {
    const a = slots.filter((s) => s.status === "available").length;
    const o = slots.filter((s) => s.status === "occupied").length;
    const r = slots.filter((s) => s.status === "reserved").length;
    const revenue = bookings
      .filter((b) => b.cost != null)
      .reduce((acc, b) => acc + (b.cost ?? 0), 0);
    const occRate = slots.length ? Math.round((o / slots.length) * 100) : 0;
    return { a, o, r, total: slots.length, revenue, occRate };
  }, [slots, bookings]);

  const occByFloor = useMemo(() => {
    const map = new Map<number, { floor: string; available: number; occupied: number; reserved: number }>();
    for (const s of slots) {
      const e = map.get(s.floor) ?? { floor: `F${s.floor}`, available: 0, occupied: 0, reserved: 0 };
      e[s.status] += 1;
      map.set(s.floor, e);
    }
    return Array.from(map.values());
  }, [slots]);

  const active = bookings.filter((b) => b.status === "active");

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview of the entire facility.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="live-dot" /> Updating in real time
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <KPI icon={ParkingCircle} label="Total slots" value={stats.total} accent="text-primary" />
        <KPI icon={Car} label="Occupied" value={`${stats.o}`} sub={`${stats.occRate}%`} accent="text-destructive" />
        <KPI icon={Activity} label="Active sessions" value={active.length} accent="text-warning" />
        <KPI icon={CircleDollarSign} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} accent="text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card border-0 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Occupancy by floor</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occByFloor}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 255 / 40%)" />
                <XAxis dataKey="floor" stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 250)",
                    border: "1px solid oklch(0.3 0.03 255 / 60%)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="available" stackId="a" fill="oklch(0.72 0.18 155)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="reserved" stackId="a" fill="oklch(0.82 0.16 80)" />
                <Bar dataKey="occupied" stackId="a" fill="oklch(0.62 0.22 22)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-0 p-5">
          <h3 className="mb-3 text-sm font-semibold">Active vehicles</h3>
          <div className="space-y-2">
            {active.length === 0 && (
              <p className="text-xs text-muted-foreground">No vehicles currently parked.</p>
            )}
            {active.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-mono text-xs font-bold">{b.plate}</div>
                  <div className="text-[11px] text-muted-foreground">{b.slotId}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.enteredAt && formatDuration(Date.now() - b.enteredAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="glass-card mt-6 border-0 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Live activity log</h3>
          <Link to="/admin/reports" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-1.5">
          {logs.slice(0, 10).map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={
                    l.type === "entry"
                      ? "rounded bg-success/20 px-2 py-0.5 font-medium text-success"
                      : l.type === "exit"
                        ? "rounded bg-destructive/20 px-2 py-0.5 font-medium text-destructive"
                        : "rounded bg-warning/20 px-2 py-0.5 font-medium text-warning"
                  }
                >
                  {l.type}
                </span>
                <span className="font-mono">{l.plate}</span>
                <span className="text-muted-foreground">@ {l.slotId}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {l.amount != null && <span className="text-success">${l.amount.toFixed(2)}</span>}
                <span>{new Date(l.at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground">No activity yet — book a slot to see logs.</p>
          )}
        </div>
      </Card>
    </Layout>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <Card className="glass-card border-0 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
    </Card>
  );
}
