import { createContext, useContext } from "react";
import type { FieldContextValue } from "./Field.types";

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}
