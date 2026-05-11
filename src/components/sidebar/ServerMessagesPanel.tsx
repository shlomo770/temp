import { useCallback, useMemo, useState } from "react";
import { FiTrash2, FiCopy, FiChevronDown, FiChevronRight, FiTerminal } from "react-icons/fi";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  clearInboundWsMessages,
  WS_INBOUND_LOG_MESSAGE_NAME,
  WS_INBOUND_MAX_ENTRIES,
  type WsInboundEntry,
} from "../../store/slices/wsInboundSlice";
import { JsonTreeNode } from "./JsonTreeViewer";

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function MessageCard({ entry }: { entry: WsInboundEntry }) {
  const [open, setOpen] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(entry.payload, null, 2);
    } catch {
      return String(entry.payload);
    }
  }, [entry.payload]);

  const copyRaw = useCallback(() => {
    void navigator.clipboard?.writeText(rawJson);
  }, [rawJson]);

  return (
    <article className="rounded-xl border border-gray-700/50 bg-gray-800/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-gray-400 shrink-0">
          {open ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </span>
        <span className="font-mono text-xs text-sky-300 font-medium truncate flex-1 min-w-0">
          {entry.name}
        </span>
        <span className="text-[10px] text-gray-500 tabular-nums shrink-0" dir="ltr">
          {formatTime(entry.ts)}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-700/30">
          <JsonTreeNode value={entry.payload} depth={0} defaultOpen />
          <div>
            <button
              type="button"
              onClick={() => setRawOpen((r) => !r)}
              className="text-[11px] text-gray-500 hover:text-gray-300 mb-1"
            >
              {rawOpen ? "▼" : "▶"} Raw JSON
            </button>
            {rawOpen && (
              <div className="relative group">
                <pre className="text-[10px] leading-relaxed font-mono text-gray-300 bg-[#0d1117] border border-gray-700/60 rounded-lg p-2 max-h-48 overflow-auto whitespace-pre">
                  {rawJson}
                </pre>
                <button
                  type="button"
                  onClick={copyRaw}
                  title="העתק"
                  className="absolute top-1 end-1 p-1 rounded bg-gray-800/90 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiCopy size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * פאנל סיידבר: רק הודעות BIT_STATUS מ־WebSocket — עץ רקורסיבי + Raw JSON.
 */
export default function ServerMessagesPanel() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s) => s.wsInbound.entries);

  return (
    <div dir="rtl" lang="he" className="w-full font-sans text-sm text-gray-200 antialiased pb-8">
      <header className="mb-3 pb-2 border-b border-gray-700/35 text-center">
        <div className="flex items-center justify-center gap-2">
          <FiTerminal className="text-sky-400/90" size={20} />
          <h3 className="text-base font-semibold text-white">BIT_STATUS</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-snug">
          רק הודעות <span className="font-mono text-gray-400">{WS_INBOUND_LOG_MESSAGE_NAME}</span> — עד{" "}
          {WS_INBOUND_MAX_ENTRIES} אחרונות
        </p>
      </header>

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-gray-500 tabular-nums" dir="ltr">
          {entries.length} הודעות
        </span>
        <button
          type="button"
          onClick={() => dispatch(clearInboundWsMessages())}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-600/70 px-2.5 py-1 text-xs text-gray-300 hover:bg-red-900/20 hover:border-red-800/50 hover:text-red-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <FiTrash2 size={14} />
          נקה הכל
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-xs text-gray-500 py-8">
          עדיין לא התקבלה הודעת {WS_INBOUND_LOG_MESSAGE_NAME}. ודא חיבור WebSocket.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e) => (
            <MessageCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
