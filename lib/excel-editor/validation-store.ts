export type ColumnValidation =
  | {
      type: "list";
      allowed: string[];
      strict?: boolean;
    }
  | {
      type: "number";
      min?: number;
      max?: number;
    }
  | {
      type: "text";
      maxLength?: number;
    };

export class ValidationStore {
  private readonly byColumn = new Map<number, ColumnValidation>();

  get(col: number): ColumnValidation | undefined {
    return this.byColumn.get(col);
  }

  set(col: number, rule: ColumnValidation): void {
    this.byColumn.set(col, rule);
  }

  remove(col: number): void {
    this.byColumn.delete(col);
  }

  exportState(): Record<string, ColumnValidation> {
    return Object.fromEntries(
      [...this.byColumn.entries()].map(([col, rule]) => [String(col), rule]),
    );
  }

  static importState(data: Record<string, ColumnValidation> | undefined): ValidationStore {
    const store = new ValidationStore();
    if (!data) return store;
    for (const [key, rule] of Object.entries(data)) {
      const col = Number(key);
      if (Number.isFinite(col)) store.set(col, rule);
    }
    return store;
  }
}
