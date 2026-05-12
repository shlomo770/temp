import { FiTrash2, FiTerminal, FiCopy } from "react-icons/fi";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {clearInboundWsMessages} from "../../store/slices/wsInboundSlice";
import { useMemo } from "react";


export default function ServerMessagesPanel() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s) => s.wsInbound.entries);

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(entries, null, 2);
    } catch {
      return String(entries);
    }
  }, [entries]);

  return (
    <div dir="rtl" lang="he" className="w-full font-sans text-sm text-gray-200 antialiased pb-8">
      <header className="mb-3 pb-2 border-b border-gray-700/35 text-center">
        <div className="flex items-center justify-center gap-2">
          <FiTerminal className="text-sky-400/90" size={20} />
          <h3 className="text-base font-semibold text-white">BIT_STATUS</h3>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 mb-3">
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

 
        <div className="flex flex-col gap-2.5">
        <div className="relative group">
                <pre className="text-[10px] text-gray-300 bg-[#0d1117] border border-gray-700/60 rounded-lg whitespace-pre">
                  {rawJson}
                </pre>
                <button
                  type="button"
                  title="העתק"
                  className="absolute top-1 end-1 p-1 rounded bg-gray-800/90 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiCopy size={12} />
                </button>
              </div>
        </div>
    </div>
  );
}

