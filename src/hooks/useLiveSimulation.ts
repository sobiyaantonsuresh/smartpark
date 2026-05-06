import { useEffect } from "react";
import { useParking } from "@/store/parking";

/** Simulated realtime: flips a random unbooked slot every few seconds. */
export function useLiveSimulation(intervalMs = 4000) {
  const randomizeOne = useParking((s) => s.randomizeOne);
  useEffect(() => {
    const t = setInterval(randomizeOne, intervalMs);
    return () => clearInterval(t);
  }, [randomizeOne, intervalMs]);
}
