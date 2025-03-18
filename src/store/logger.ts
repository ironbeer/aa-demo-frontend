/* eslint-disable @typescript-eslint/no-explicit-any */

import { serialize } from "superjson";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const maxLogEntry = 50;

export type LogEntry = {
  date: string;
  level: string;
  tag: string;
  message: string;
};

export type Logger = {
  isChild: () => boolean;
  child: (childTag: string) => Logger;
  info: (lastTag: string, log: any) => void;
  error: (lastTag: string, log: any) => void;
  calllog: <F extends (...args: any[]) => any>(
    childTag: null | string,
    fn: F,
    ...args: Parameters<F>
  ) => Promise<Awaited<ReturnType<F>>>;
};

export type LoggerStoreState = {
  logs: LogEntry[];
  getLogger: (tag: string) => Logger;
};

const baseEntry = (log: any): LogEntry => {
  const date = new Date().toLocaleString("ja-JP");
  let message = log;
  // 文字列でない場合はシリアライズ
  if (typeof log !== "string") {
    const { json } = serialize(log);
    message = JSON.stringify(json);
  }
  return { date, level: "", tag: "", message };
};

export const useLoggerStore = create<LoggerStoreState>()(
  persist(
    (set, get) => ({
      logs: [],
      getLogger: (tag) => ({
        isChild: () => tag.includes("."),
        child: (childTag) => get().getLogger(`${tag}.${childTag}`),
        info: (lastTag, log) => {
          const newEntry = baseEntry(log);
          newEntry.level = "info";
          newEntry.tag = `${tag}.${lastTag}`;
          set({ logs: [newEntry, ...get().logs].slice(0, maxLogEntry) });
        },
        error: (lastTag, log) => {
          const newEntry = baseEntry(log);
          newEntry.level = "error";
          newEntry.tag = `${tag}.${lastTag}`;
          set({ logs: [newEntry, ...get().logs].slice(0, maxLogEntry) });
        },
        calllog: async (childTag, fn, ...args) => {
          let logger = get().getLogger(tag);
          if (childTag) logger = logger.child(childTag);

          try {
            logger.info("call", args);
            let result = fn(...args);
            if (result instanceof Promise) {
              result = await result;
            }
            logger.info("return", result);
            return result;
          } catch (error) {
            logger.error("error", String(error));
            throw error;
          }
        },
      }),
    }),
    {
      name: "logger",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
