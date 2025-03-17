import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const maxLogEntry = 50;

export type LogEntry = {
  date: string;
  level: string;
  action: string;
  message: string;
};

export type LoggerStoreState = {
  logs: LogEntry[];
  getLogger: () => {
    info: (action: string, log: string | object) => void;
    error: (action: string, log: string | object) => void;
  };
};

const baseEntry = (log: string | object): LogEntry => {
  const date = new Date().toLocaleString("ja-JP");
  const message = typeof log === "string" ? log : JSON.stringify(log, null, 2);
  return {
    date,
    level: "",
    action: "",
    message,
  };
};

export const useLoggerStore = create<LoggerStoreState>()(
  persist(
    (set, get) => ({
      logs: [],
      getLogger: () => ({
        info: (action, log) => {
          const newEntry = baseEntry(log);
          newEntry.level = "info";
          newEntry.action = action;
          set({ logs: [newEntry, ...get().logs].slice(0, maxLogEntry) });
        },
        error: (action, log) => {
          const newEntry = baseEntry(log);
          newEntry.level = "error";
          newEntry.action = action;
          set({ logs: [newEntry, ...get().logs].slice(0, maxLogEntry) });
        },
      }),
    }),
    {
      name: "logger",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
