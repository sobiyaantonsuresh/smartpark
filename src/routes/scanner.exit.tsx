import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useParking, formatDuration } from "@/store/parking";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle2, XCircle, Receipt } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scanner/exit")({
  head: () => ({ meta: [{ title: "Exit scanner · SmartPark" }] }),
  component: ExitScanner,
});

function ExitScanner() {
  const markExit = useParking((s) => s.markExit);
  const bookings = useParking((s) => s.bookings);
  const [code, setCode] = useState("");
  const [last, setLast] = useState<{
    ok: boolean;
    msg: string;
    bookingId?: string;
    cost?: number;
    duration?: string;
  } | null>(null);

  const activeQueue = bookings.filter((b) => b.status === "active").slice(0, 5);

  const scan = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) {
      setLast({ ok: false, msg: `Unknown code: ${id}` });
      toast.error("Invalid QR");
      return;
    }
    if (b.status !== "active") {
      setLast({ ok: false, msg: `Booking is ${b.status}, not active` });
      toast.error(`Cannot exit — ${b.status}`);
      return;
    }
    const updated = markExit(id);
    if (updated && updated.enteredAt && updated.exitedAt) {
      setLast({
        ok: true,
        msg: `${updated.plate} · slot ${updated.slotId}`,
        bookingId: id,
        cost: updated.cost,
        duration: formatDuration(updated.exitedAt - updated.enteredAt),
      });
      toast.success(`Checked out · $${updated.cost?.toFixed(2)}`);
    }
    setCode("");
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Exit Gate Scanner</h1>
            <p className="text-sm text-muted-foreground">
              Scan the booking QR to check out and auto-bill.
            </p>
          </div>
        </div>

        <Card className="glass-card border-0 p-6">
          <div className="flex gap-2">
            <Input
              placeholder="Paste booking ID"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && code && scan(code.trim())}
            />
            <Button onClick={() => code && scan(code.trim())}>Scan</Button>
          </div>

          {last && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                last.ok
                  ? "border-success/40 bg-success/10"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              } animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className="flex items-start gap-3">
                {last.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="flex-1">
                  <div className={`font-semibold ${last.ok ? "text-success" : ""}`}>
                    {last.ok ? "Checkout complete" : "Checkout failed"}
                  </div>
                  <div className="text-sm opacity-90">{last.msg}</div>
                  {last.ok && last.cost != null && (
                    <div className="mt-3 flex items-center justify-between rounded-md bg-background/50 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                          Duration: <span className="text-foreground">{last.duration}</span>
                        </span>
                      </div>
                      <div className="text-xl font-bold text-success">
                        ${last.cost.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {last.bookingId && (
                    <Link
                      to="/booking/$id"
                      params={{ id: last.bookingId }}
                      className="mt-2 inline-block text-xs text-primary underline"
                    >
                      View receipt →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="glass-card mt-6 border-0 p-5">
          <h3 className="mb-3 text-sm font-semibold">Currently parked (tap to checkout)</h3>
          {activeQueue.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active sessions right now.</p>
          ) : (
            <div className="space-y-2">
              {activeQueue.map((b) => (
                <button
                  key={b.id}
                  onClick={() => scan(b.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm transition hover:bg-background/70"
                >
                  <div className="text-left">
                    <div className="font-mono text-xs font-bold">{b.plate}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.slotId} · parked {b.enteredAt && formatDuration(Date.now() - b.enteredAt)}
                    </div>
                  </div>
                  <span className="text-xs text-primary">Checkout →</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
