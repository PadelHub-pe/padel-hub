"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface BreadcrumbContextValue {
  entityLabel: string | null;
  setEntityLabel: (label: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  entityLabel: null,
  setEntityLabel: () => {
    // noop
  },
});

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entityLabel, setEntityLabelState] = useState<string | null>(null);

  const setEntityLabel = useCallback((label: string | null) => {
    setEntityLabelState(label);
  }, []);

  const value = useMemo(
    () => ({ entityLabel, setEntityLabel }),
    [entityLabel, setEntityLabel],
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Hook for page-level components to set entity-specific breadcrumb labels.
 * Call this in components that display entity details (court name, booking code, etc.)
 * The label is automatically cleared on unmount.
 */
export function useSetBreadcrumbEntity(label: string | undefined | null) {
  const { setEntityLabel } = useContext(BreadcrumbContext);

  useEffect(() => {
    if (label) {
      setEntityLabel(label);
    }
    return () => {
      setEntityLabel(null);
    };
  }, [label, setEntityLabel]);
}

export function useBreadcrumbEntity() {
  return useContext(BreadcrumbContext);
}
