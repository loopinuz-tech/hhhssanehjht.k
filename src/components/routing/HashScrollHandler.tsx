import { useScrollToHash } from "@/hooks/useScrollToHash";

/** Global hash scroll on any route (e.g. /support#complaints). */
export default function HashScrollHandler() {
  useScrollToHash();
  return null;
}
