"use client";

import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrums";
import { Download } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type LogType = "success" | "error" | "info" | "warning" | "debug";
type LogItem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
};

const typeColorMap: Record<LogType, string> = {
  success: "green",
  error: "red",
  info: "blue",
  warning: "yellow",
  debug: "gray",
};

const Loggers = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(
      process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:6008"
    );
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLogs((prev) => [...prev, parsed]);
      } catch (error) {
        console.error("Invalid log message:", error);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    setFilteredLogs(logs);

    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  //Handle key presses for filtering
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setFilteredLogs(logs.filter((log) => log.type === "error"));
      } else if (event.key === "2") {
        setFilteredLogs(logs.filter((log) => log.type === "success"));
      } else if (event.key === "0") {
        setFilteredLogs(logs);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [logs]);

  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleString()}] ${log.source || "Unknown"
          } [${log.type.toUpperCase()}]: ${log.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application-logs.log";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
      {/* Header */}
      <div className="flex justify-between intems-center mb-3">
        <BreadCrumbs title="Application Logs" />
        <button
          onClick={downloadLogs}
          className="flex items-center gap-2 px-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          <Download size={18} />
          Download
        </button>
      </div>
      {/* Log Container */}
      <div
        ref={logContainerRef}
        className="mt-4 p-4 bg-gray-900 rounded h-[70vh] overflow-y-auto font-mono"
      >
        {filteredLogs.length === 0 ? (
          <p className="text-gray-400">No logs available.</p>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`mb-2 p-2 border-l-4 border-${typeColorMap[log.type]}-500 bg-gray-800`}
              >
                <span>
                  [{new Date(log.timestamp).toLocaleString()}]{" "}
                </span>
                <span className="text-purple-500">{log.source || "Unknown"}</span>
                <span className={`text-${typeColorMap[log.type]}-500`}>
                  {" "}[{log.type.toUpperCase()}]:
                </span>
                <span> {log.message}</span>
              </div>
            ))
          )
          }

      </div>
    </div>
  );
};

export default Loggers;
