import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My bookings · SmartPark" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const bookings = useParking((s) => s.bookings);

  return (
    <Layout>
      <h1 className="mb-1 text-2xl font-bold">My bookings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        All your parking sessions, past and present.
      </p>

      {bookings.length === 0 ? (
        <Card className="glass-card border-0 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No bookings yet.{" "}
            <Link to="/" className="text-primary hover:underline">
              Find a spot
            </Link>{" "}
            to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const dur =
              b.enteredAt && b.exitedAt
                ? formatDuration(b.exitedAt - b.enteredAt)
                : b.enteredAt
                  ? formatDuration(Date.now() - b.enteredAt)
                  : "—";
            return (
              <Link
                key={b.id}
                to="/booking/$id"
                params={{ id: b.id }}
                className="block"
              >
                <Card className="glass-card border-0 p-4 transition hover:scale-[1.01] hover:glow">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold">{b.slotId}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.plate} · {new Date(b.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{dur}</span>
                      {b.cost != null && (
                        <span className="font-semibold text-success">
                          ${b.cost.toFixed(2)}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          b.status === "active"
                            ? "border-destructive/40 text-destructive"
                            : b.status === "reserved"
                              ? "border-warning/40 text-warning"
                              : "border-border"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
