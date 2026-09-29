import AsyncStorage from "@react-native-async-storage/async-storage";
import { BuildConfiguration } from "../engine/types";
import { validateConfiguration } from "../engine/validation";
const KEY = "riftcalc.builds.v1";
export async function loadBuilds(): Promise<{
  builds: BuildConfiguration[];
  rejected: number;
}> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { builds: [], rejected: 0 };
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw Error("Formato de guardado inválido.");
  const builds = data.filter((c): c is BuildConfiguration => {
    try {
      return validateConfiguration(c).length === 0;
    } catch {
      return false;
    }
  });
  return { builds, rejected: data.length - builds.length };
}
export async function persistBuilds(builds: BuildConfiguration[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(builds));
}
