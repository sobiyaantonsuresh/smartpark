import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { QRDisplay } from "@/components/QRDisplay";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, MapPin, Clock, Receipt } from "lucide-react";

export const Route = createFileRoute("/booking/$id")({
  head: () => ({ meta: [{ title: "Your booking · SmartPark" }] }),
  component: BookingPage,
  notFoundComponent: () => (
    <Layout>
      <div className="text-center text-muted-foreground">Booking not found.</div>
    </Layout>
  ),
});

function BookingPage() {
  const { id } = Route.useParams();
  const booking = useParking((s) => s.bookings.find((b) => b.id === id));
  const rate = useParking((s) => s.hourlyRate);

  if (!booking) throw notFound();

  const statusColor =
    booking.status === "completed"
      ? "bg-muted text-muted-foreground"
      : booking.status === "active"
        ? "bg-destructive/20 text-destructive border-destructive/40"
        : "bg-warning/20 text-warning border-warning/40";

  const duration =
    booking.enteredAt && booking.exitedAt
      ? formatDuration(booking.exitedAt - booking.enteredAt)
      : booking.enteredAt
        ? formatDuration(Date.now() - booking.enteredAt)
        : "—";

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to slots
        </Link>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="glass-card border-0 p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Booking</div>
              <h1 className="font-mono text-xl font-bold">{booking.id}</h1>
            </div>
            <Badge className={`border ${statusColor}`}>{booking.status}</Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex justify-center">
              <QRDisplay value={booking.id} size={200} />
            </div>
            <div className="space-y-3">
              <Row icon={MapPin} label="Slot" value={booking.slotId} />
              <Row icon={Car} label="Plate" value={booking.plate} />
              <Row icon={Clock} label="Duration" value={duration} />
              <Row
                icon={Receipt}
                label={booking.cost ? "Total" : "Rate"}
                value={booking.cost ? `$${booking.cost.toFixed(2)}` : `$${rate.toFixed(2)}/hr`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-background/40 p-4 text-xs text-muted-foreground">
            {booking.status === "reserved" && (
              <>Show this QR at the <strong className="text-foreground">entry gate</strong> scanner to check in.</>
            )}
            {booking.status === "active" && (
              <>You're parked. Scan the same QR at the <strong className="text-foreground">exit gate</strong> to check out.</>
            )}
            {booking.status === "completed" && (
              <>Session complete. Receipt issued for ${booking.cost?.toFixed(2)}.</>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/scanner/entry">Open entry scanner</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/scanner/exit">Open exit scanner</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/bookings">All my bookings</Link>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
