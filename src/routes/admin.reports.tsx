import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports · SmartPark" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const bookings = useParking((s) => s.bookings);
  const logs = useParking((s) => s.logs);

  const totals = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "completed");
    const revenue = completed.reduce((a, b) => a + (b.cost ?? 0), 0);
    const avg =
      completed.length > 0
        ? completed.reduce((a, b) => a + ((b.exitedAt ?? 0) - (b.enteredAt ?? 0)), 0) /
          completed.length
        : 0;
    return { sessions: completed.length, revenue, avg };
  }, [bookings]);

  return (
    <Layout>
      <h1 className="mb-1 text-2xl font-bold">Reports</h1>
      <p className="mb-6 text-sm text-muted-foreground">Revenue and activity history.</p>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-0 p-4">
          <div className="text-xs text-muted-foreground">Completed sessions</div>
          <div className="mt-1 text-2xl font-bold">{totals.sessions}</div>
        </Card>
        <Card className="glass-card border-0 p-4">
          <div className="text-xs text-muted-foreground">Total revenue</div>
          <div className="mt-1 text-2xl font-bold text-success">
            ${totals.revenue.toFixed(2)}
          </div>
        </Card>
        <Card className="glass-card border-0 p-4">
          <div className="text-xs text-muted-foreground">Avg session</div>
          <div className="mt-1 text-2xl font-bold">{formatDuration(totals.avg)}</div>
        </Card>
      </div>

      <Card className="glass-card border-0 p-5">
        <h3 className="mb-3 text-sm font-semibold">Activity log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Time</th>
                <th className="py-2 text-left font-medium">Type</th>
                <th className="py-2 text-left font-medium">Plate</th>
                <th className="py-2 text-left font-medium">Slot</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="py-2 text-muted-foreground">
                    {new Date(l.at).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <span
                      className={
                        l.type === "entry"
                          ? "text-success"
                          : l.type === "exit"
                            ? "text-destructive"
                            : "text-warning"
                      }
                    >
                      {l.type}
                    </span>
                  </td>
                  <td className="py-2 font-mono">{l.plate}</td>
                  <td className="py-2 font-mono">{l.slotId}</td>
                  <td className="py-2 text-right">
                    {l.amount != null ? `$${l.amount.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
