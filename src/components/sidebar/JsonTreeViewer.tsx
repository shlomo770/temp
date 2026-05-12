import { useCallback, useState, type ReactNode } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const indentPx = 14;

function PrimitiveView({ value }: { value: unknown }) {
    if (value === null) {
        return <span className="text-gray-500 font-mono text-xs">null</span>;
    }
    if (value === undefined) {
        return <span className="text-gray-500 font-mono text-xs">undefined</span>;
    }
    const t = typeof value;
    if (t === "boolean") {
        return <span className="text-amber-300/90 font-mono text-xs">{String(value)}</span>;
    }
    if (t === "number") {
        return <span className="text-sky-300 font-mono text-xs tabular-nums">{value as ReactNode}</span>;
    }
    if (t === "string") {
        const s = value as string;
        const shown = s.length > 200 ? `${s.slice(0, 200)}…` : s;
        return (
            <span className="text-emerald-400/95 font-mono text-xs break-all whitespace-pre-wrap">
                &quot;{shown}&quot;
                {s.length > 200 && (
                    <span className="text-gray-500"> ({s.length} תווים)</span>
                )}
            </span>
        );
    }
    return (
        <span className="text-gray-400 font-mono text-xs">{String(value)}</span>
    );
}

type NodeProps = {
    value: unknown;
    depth: number;
    defaultOpen?: boolean;
};


export function JsonTreeNode({ value, depth, defaultOpen }: NodeProps) {
    const [open, setOpen] = useState(
        defaultOpen ?? depth < 1
    );

    const toggle = useCallback(() => setOpen((o) => !o), []);

    const padStyle = { paddingInlineStart: depth * indentPx };

    let body: ReactNode;

    if (value === null || value === undefined) {
        body = <PrimitiveView value={value} />;
    } else if (Array.isArray(value)) {
        const n = value.length;
        body = (
            <div className="min-w-0" style={padStyle}>
                <button
                    type="button"
                    onClick={toggle}
                    className="flex items-start gap-1 text-start w-full rounded px-0.5 py-0.5 -mx-0.5 hover:bg-white/[0.04] text-gray-200"
                >
                    <span className="shrink-0 mt-0.5 text-gray-400">
                        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="font-mono text-xs text-sky-400/95">
                        [{n}] {n === 1 ? "איבר" : "איברים"}
                    </span>
                </button>
                {open && (
                    <div className="mt-1 space-y-0.5 border-s border-gray-600/50 ms-1.5 ps-2">
                        {value.map((item, i) => (
                            <div key={i} className="py-0.5">
                                <span className="text-gray-500 font-mono text-[10px] me-1">{i}:</span>
                                <JsonTreeNode value={item} depth={depth + 1} defaultOpen={depth < 1} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    } else if (typeof value === "object") {
        const keys = Object.keys(value as object);
        const n = keys.length;
        body = (
            <div className="min-w-0" style={padStyle}>
                <button
                    type="button"
                    onClick={toggle}
                    className="flex items-start gap-1 text-start w-full rounded px-0.5 py-0.5 -mx-0.5 hover:bg-white/[0.04] text-gray-200"
                >
                    <span className="shrink-0 mt-0.5 text-gray-400">
                        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="font-mono text-xs text-violet-300/95">
                        {"{"}
                        {n}
                        {"}"} {n === 1 ? "שדה" : "שדות"}
                    </span>
                </button>
                {open && (
                    <div className="mt-1 space-y-0.5 border-s border-gray-600/50 ms-1.5 ps-2">
                        {keys.map((k) => (
                            <div key={k} className="py-0.5">
                                <span className="text-amber-200/80 font-mono text-xs">{k}</span>
                                <span className="text-gray-600 mx-1">:</span>
                                <JsonTreeNode
                                    value={(value as Record<string, unknown>)[k]}
                                    depth={depth + 1}
                                    defaultOpen={depth < 1}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    } else {
        body = <PrimitiveView value={value} />;
    }

    return <div className="text-sm max-w-full">{body}</div>;
}