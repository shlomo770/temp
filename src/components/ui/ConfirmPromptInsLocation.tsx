import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { closePrompt } from "../../store/slices/confirmSlice";
import { useWebSocket } from '../../hooks/useWebSocket';
import { WsMessageName } from "../../enums/ws.enum";
import { useRef } from "react";
import { createPortal } from "react-dom";


export const ConfirmPromptInsLocation = () => {
    const { sendMessage } = useWebSocket();
    const prompt = useAppSelector((s) => s.confirm.prompt);
    const dispatch = useAppDispatch();
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const confirmLocation = (ans: boolean) => {
        sendMessage(WsMessageName.ConfirmPosition, { confirmed: ans });
        dispatch(closePrompt());
    }
    if (!prompt) return null;
    const { title = "אישור פעולה", message, confirmText = "מאשר", cancelText = "בטל" } = prompt;
    const modal = (
        <div
            ref={backdropRef}
            dir="rtl"
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                className="w-[min(92vw,480px)] rounded-2xl border border-white/10 bg-[rgba(20,20,22,0.85)] shadow-2xl text-white text-right
                   animate-[fadeIn_.12s_ease-out] overflow-hidden">
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 shrink-0 rounded-xl bg-white/10 grid place-items-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M12 8v5m0 4h.01M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Z"
                                    stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                        </div>
                        <div className="min-w-0 text-right">
                            <h3 className="text-lg font-semibold leading-snug">{title}</h3>
                            <p className="mt-1 text-sm text-white/80 break-words">{message}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex items-center justify-end gap-2">
                        <button
                            onClick={() => confirmLocation(true)}
                            className="h-9 rounded-xl px-3.5 text-sm font-semibold text-black bg-white hover:bg-white/90 active:scale-[.98] transition">
                            {confirmText}
                        </button>
                        <button
                            onClick={() => confirmLocation(false)}
                            className="h-9 rounded-xl px-3.5 text-sm text-white/90 border border-white/15 hover:bg-white/5 active:scale-[.98] transition">
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
            <style>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) scale(.98) } to { opacity: 1; transform: translateY(0)     scale(1) } }`}</style>
        </div>
    );
    return createPortal(modal, document.body);
}

export default ConfirmPromptInsLocation;