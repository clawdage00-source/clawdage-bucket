const LS_KEY = "essential-toolbox-esign-saved-sigs-v1";

export type SavedSignature = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
};

function safeParse(raw: string | null): SavedSignature[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is SavedSignature =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as SavedSignature).id === "string" &&
          typeof (x as SavedSignature).name === "string" &&
          typeof (x as SavedSignature).dataUrl === "string",
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function loadSavedSignatures(): SavedSignature[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(LS_KEY));
}

export function persistSavedSignatures(list: SavedSignature[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function addSavedSignature(name: string, dataUrl: string): SavedSignature[] {
  const prev = loadSavedSignatures();
  const entry: SavedSignature = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim() || "My sign",
    dataUrl,
    createdAt: Date.now(),
  };
  const next = [entry, ...prev].slice(0, 20);
  persistSavedSignatures(next);
  return next;
}

export function removeSavedSignature(id: string): SavedSignature[] {
  const next = loadSavedSignatures().filter((s) => s.id !== id);
  persistSavedSignatures(next);
  return next;
}
