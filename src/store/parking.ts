import { create } from "zustand";

export type SlotStatus = "available" | "occupied" | "reserved";

export interface Slot {
  id: string;
  floor: number;
  zone: string;
  status: SlotStatus;
  bookingId?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  plate: string;
  driverName: string;
  createdAt: number;
  enteredAt?: number;
  exitedAt?: number;
  cost?: number;
  status: "reserved" | "active" | "completed";
}

export interface LogEntry {
  id: string;
  type: "entry" | "exit" | "booking";
  slotId: string;
  plate: string;
  at: number;
  amount?: number;
}

interface State {
  hourlyRate: number;
  slots: Slot[];
  bookings: Booking[];
  logs: LogEntry[];
  selectedFloor: number | "all";
  bookSlot: (slotId: string, plate: string, driverName: string) => Booking;
  markEntry: (bookingId: string) => Booking | null;
  markExit: (bookingId: string) => Booking | null;
  addSlot: (floor: number, zone: string) => void;
  removeSlot: (slotId: string) => void;
  setFloor: (f: number | "all") => void;
  randomizeOne: () => void;
}

const FLOORS = 3;
const ZONES = ["A", "B"];
const PER_ZONE = 10;

function seedSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let f = 1; f <= FLOORS; f++) {
    for (const z of ZONES) {
      for (let i = 1; i <= PER_ZONE; i++) {
        const id = `F${f}-${z}${String(i).padStart(2, "0")}`;
        const r = Math.random();
        const status: SlotStatus = r < 0.45 ? "occupied" : r < 0.6 ? "reserved" : "available";
        slots.push({ id, floor: f, zone: z, status });
      }
    }
  }
  return slots;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export const useParking = create<State>((set, get) => ({
  hourlyRate: 3,
  slots: seedSlots(),
  bookings: [],
  logs: [],
  selectedFloor: "all",

  setFloor: (f) => set({ selectedFloor: f }),

  bookSlot: (slotId, plate, driverName) => {
    const booking: Booking = {
      id: uid("BK"),
      slotId,
      plate: plate.toUpperCase(),
      driverName,
      createdAt: Date.now(),
      status: "reserved",
    };
    set((s) => ({
      bookings: [booking, ...s.bookings],
      slots: s.slots.map((sl) =>
        sl.id === slotId ? { ...sl, status: "reserved", bookingId: booking.id } : sl,
      ),
      logs: [
        { id: uid("L"), type: "booking", slotId, plate: booking.plate, at: Date.now() } as LogEntry,
        ...s.logs,
      ].slice(0, 200),
    }));
    return booking;
  },

  markEntry: (bookingId) => {
    const b = get().bookings.find((x) => x.id === bookingId);
    if (!b || b.status !== "reserved") return null;
    const enteredAt = Date.now();
    const updated: Booking = { ...b, enteredAt, status: "active" };
    set((s) => ({
      bookings: s.bookings.map((x) => (x.id === bookingId ? updated : x)),
      slots: s.slots.map((sl) =>
        sl.id === b.slotId ? { ...sl, status: "occupied", bookingId } : sl,
      ),
      logs: [
        { id: uid("L"), type: "entry", slotId: b.slotId, plate: b.plate, at: enteredAt } as LogEntry,
        ...s.logs,
      ].slice(0, 200),
    }));
    return updated;
  },

  markExit: (bookingId) => {
    const b = get().bookings.find((x) => x.id === bookingId);
    if (!b || b.status !== "active" || !b.enteredAt) return null;
    const exitedAt = Date.now();
    const hours = Math.max(0.25, (exitedAt - b.enteredAt) / 3_600_000);
    const cost = Number((hours * get().hourlyRate).toFixed(2));
    const updated: Booking = { ...b, exitedAt, cost, status: "completed" };
    set((s) => ({
      bookings: s.bookings.map((x) => (x.id === bookingId ? updated : x)),
      slots: s.slots.map((sl) =>
        sl.id === b.slotId ? { ...sl, status: "available", bookingId: undefined } : sl,
      ),
      logs: [
        { id: uid("L"), type: "exit", slotId: b.slotId, plate: b.plate, at: exitedAt, amount: cost } as LogEntry,
        ...s.logs,
      ].slice(0, 200),
    }));
    return updated;
  },

  addSlot: (floor, zone) =>
    set((s) => {
      const inZone = s.slots.filter((x) => x.floor === floor && x.zone === zone).length;
      const id = `F${floor}-${zone}${String(inZone + 1).padStart(2, "0")}`;
      return { slots: [...s.slots, { id, floor, zone, status: "available" }] };
    }),

  removeSlot: (slotId) => set((s) => ({ slots: s.slots.filter((x) => x.id !== slotId) })),

  randomizeOne: () =>
    set((s) => {
      // Flip a random unbooked slot between available <-> reserved (simulated activity)
      const candidates = s.slots.filter((x) => !x.bookingId);
      if (candidates.length === 0) return {};
      const t = candidates[Math.floor(Math.random() * candidates.length)];
      const next: SlotStatus = t.status === "available" ? "reserved" : "available";
      return {
        slots: s.slots.map((sl) => (sl.id === t.id ? { ...sl, status: next } : sl)),
      };
    }),
}));

export function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}
