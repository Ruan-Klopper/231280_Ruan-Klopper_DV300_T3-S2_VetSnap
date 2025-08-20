// components/global/TabContext.tsx
import React, { createContext, useContext } from "react";

export type TabKey = "home" | "book" | "pulse" | "chat" | "profile" | "search";

type TabContextType = {
  setActiveTab: (key: TabKey) => void;
};

export const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTab must be used within a TabProvider");
  }
  return context;
};
