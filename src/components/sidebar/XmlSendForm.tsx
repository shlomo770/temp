import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { xml } from "@codemirror/lang-xml";
import { useWebSocket } from "../../hooks/useWebSocket";
import { WsMessageName } from "../../enums/ws.enum";
import { validateOutboundMessage } from "../../services/webSocket/wsValidators";

type EditorProps = {
  value: string;
  onChange?: (val: string) => void;
};

function XmlCodeEditor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        EditorView.theme({
          "&": {
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            minHeight: "280px",
          },
          ".cm-content": { fontFamily: "ui-monospace, monospace", fontSize: "13px" },
          ".cm-gutters": {
            backgroundColor: "#1e1e1e",
            color: "#858585",
            border: "none",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="border border-gray-700 rounded-lg overflow-hidden min-h-[280px]" />;
}

/** טופס XML לסיידבר — ללא props חיצוניים; משתמש ב־&lt;XmlSendForm /&gt; */
export default function XmlSendForm() {
  const { sendMessage, isConnected } = useWebSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [xmlText, setXmlText] = useState("");
  const [sendHint, setSendHint] = useState<string | null>(null);

  const connected = isConnected();

  const ingestFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setXmlText(String(reader.result || ""));
    reader.readAsText(file, "UTF-8");
  }, []);

  const onSend = useCallback(() => {
    setSendHint(null);
    if (!connected) {
      setSendHint("אין חיבור");
      return;
    }
    const payload = { xml: xmlText.trim() };
    if (!validateOutboundMessage(WsMessageName.SendXml, payload)) {
      setSendHint("XML ריק או לא תקין");
      return;
    }
    sendMessage(WsMessageName.SendXml, payload);
    setSendHint("נשלח");
  }, [connected, sendMessage, xmlText]);

  return (
    <div className="flex flex-col gap-2 h-full text-sm text-gray-200">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,text/xml,application/xml,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) ingestFile(file);
        }}
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          טען
        </button>
        <button
          type="button"
          onClick={() => {
            setXmlText("");
            setSendHint(null);
          }}
          className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          נקה
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={!connected}
          className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 disabled:opacity-40 disabled:pointer-events-none"
        >
          שלח
        </button>
      </div>

      <XmlCodeEditor value={xmlText} onChange={setXmlText} />

      {sendHint && <div className="text-xs text-gray-400">{sendHint}</div>}
    </div>
  );
}
