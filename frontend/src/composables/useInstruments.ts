import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import axios from "axios";
import type { Option } from "@/components/MultiSelect.vue";
import { backendUrl, compareValues } from "@/lib";
import { alphabeticalSort } from "@/lib/SearchUtils";
import type { Instrument, InstrumentInfo } from "@shared/entity/Instrument";

type InstrumentPidOption = Option & { type: string };

const instrumentSort = (a: Instrument, b: Instrument) =>
  a.type == b.type
    ? compareValues(a.shortName || a.humanReadableName, b.shortName || b.humanReadableName)
    : compareValues(a.type, b.type);

export function useInstruments() {
  const allInstruments: Ref<Instrument[]> = ref([]);
  const allInstrumentPids: Ref<InstrumentPidOption[]> = ref([]);
  const error = ref<string | null>(null);
  const isLoading = ref(true);

  const fetchInstruments = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const [instruments, pids] = await Promise.all([
        axios.get<Instrument[]>(`${backendUrl}instruments`),
        axios.get<InstrumentInfo[]>(`${backendUrl}instrument-pids`),
      ]);

      allInstruments.value = instruments.data.sort(instrumentSort);
      allInstrumentPids.value = pids.data
        .map((obj) => ({
          id: obj.pid,
          humanReadableName: obj.name,
          type: obj.instrument.type,
        }))
        .sort(alphabeticalSort);
    } catch (e) {
      console.error("Failed to fetch instrument data:", e);
      error.value = "Could not load instrument data.";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchInstruments);

  return {
    allInstruments,
    allInstrumentPids,
    error,
    isLoading,
    refetch: fetchInstruments,
  };
}
