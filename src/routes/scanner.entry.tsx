import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle2, XCircle, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scanner/entry")({
  head: () => ({ meta: [{ title: "Entry scanner · SmartPark" }] }),
  component: EntryScanner,
});

export const ExitRoute = null;

function EntryScanner() {
  const markEntry = useParking((s) => s.markEntry);
  const bookings = useParking((s) => s.bookings);
  const [code, setCode] = useState("");
  const [last, setLast] = useState<{ ok: boolean; msg: string; bookingId?: string } | null>(null);

  const reservedQueue = bookings.filter((b) => b.status === "reserved").slice(0, 5);

  const scan = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) {
      setLast({ ok: false, msg: `Unknown code: ${id}` });
      toast.error("Invalid QR code");
      return;
    }
    if (b.status !== "reserved") {
      setLast({ ok: false, msg: `Booking already ${b.status}` });
      toast.error(`Already ${b.status}`);
      return;
    }
    const updated = markEntry(id);
    if (updated) {
      setLast({ ok: true, msg: `Welcome ${updated.plate} · slot ${updated.slotId}`, bookingId: id });
      toast.success("Vehicle checked in");
    }
    setCode("");
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
            <ScanLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Entry Gate Scanner</h1>
            <p className="text-sm text-muted-foreground">Scan or paste a booking QR to check in.</p>
          </div>
        </div>

        <Card className="glass-card border-0 p-6">
          <div className="flex gap-2">
            <Input
              placeholder="Paste booking ID (e.g. BK_xxxx)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && code && scan(code.trim())}
            />
            <Button onClick={() => code && scan(code.trim())}>Scan</Button>
          </div>

          {last && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${
                last.ok
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              } animate-in fade-in slide-in-from-bottom-2`}
            >
              {last.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <div className="text-sm">
                <div className="font-semibold">{last.ok ? "Entry approved" : "Entry denied"}</div>
                <div className="opacity-80">{last.msg}</div>
                {last.bookingId && (
                  <Link
                    to="/booking/$id"
                    params={{ id: last.bookingId }}
                    className="mt-1 inline-block text-xs underline opacity-90"
                  >
                    View booking →
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="glass-card mt-6 border-0 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <QrCode className="h-4 w-4" /> Pending entries (tap to simulate scan)
          </h3>
          {reservedQueue.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No reservations waiting.{" "}
              <Link to="/" className="text-primary hover:underline">
                Create one
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {reservedQueue.map((b) => (
                <button
                  key={b.id}
                  onClick={() => scan(b.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm transition hover:bg-background/70"
                >
                  <div className="text-left">
                    <div className="font-mono text-xs font-bold">{b.plate}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.slotId} · reserved {formatDuration(Date.now() - b.createdAt)} ago
                    </div>
                  </div>
                  <span className="text-xs text-primary">Scan →</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
