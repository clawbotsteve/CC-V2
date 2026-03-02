import fs from "fs";
import path from "path";
import pino from "pino";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "app.log");

fs.mkdirSync(logDir, { recursive: true });

const isDev = process.env.NODE_ENV === "development";

export const logger = pino(
  isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
            singleLine: false,
          },
        },
      }
    : {}, // ← Use empty config for production
  pino.destination({
    dest: logFile,
    sync: false,
  })
);
