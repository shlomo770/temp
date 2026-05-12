import { FC } from "react";
import { FaTimes } from "react-icons/fa";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { setCreationForm, setDrawingMode, setSelectedMarkerIcon } from "../../store/slices/entitiesSlice";
import { setMode } from "../../store/slices/drawSlice";
import { MARKER_ICONS, getMarkerIconChar } from "../../constants/MarkerIcons";
import { EntityCategoryEnum } from "../../enums/entitis.enum";

interface EntityMarkerCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EntityMarkerCreationPanel: FC<EntityMarkerCreationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const creationName = useAppSelector((s) => s.entities.creationName);
  const creationHeight = useAppSelector((s) => s.entities.creationHeight);
  const selectedIcon = useAppSelector((s) => s.entities.selectedMarkerIcon);

  const handleClose = () => {
    dispatch(setCreationForm({ name: "", category: EntityCategoryEnum.FREE, height: 0 }));
    dispatch(setSelectedMarkerIcon(null));
    onClose();
  };

  const handleSelectIcon = (code: string) => {
    dispatch(setSelectedMarkerIcon(code));
  };

  const handleStartDrawing = () => {
    if (!selectedIcon) return;
    const name = creationName?.trim() || "נקודה";
    dispatch(setCreationForm({ name, category: EntityCategoryEnum.FREE, height: creationHeight }));
    dispatch(setDrawingMode("marker"));
    dispatch(setMode("marker" as any));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-24 top-24 z-[1000] w-[min(300px,calc(100vw-6rem))] max-h-[min(72vh,420px)] overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/40 ring-1 ring-white/[0.04]">
      <button
        onClick={handleClose}
        className="absolute end-2 top-2 z-50 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100"
        type="button"
        aria-label="סגור"
      >
        <FaTimes className="h-3.5 w-3.5" />
      </button>

      <div className="max-h-[inherit] overflow-y-auto px-3 pb-3 pt-2">
        <div className="mb-3 border-b border-zinc-700/50 pb-2 pe-8">
          <h3 className="text-[13px] font-semibold tracking-tight text-zinc-100">נקודה חדשה</h3>
          <p className="mt-0.5 text-[10px] text-zinc-500">שם · אייקון קטן · ציור במפה</p>
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            שם
          </label>
          <input
            type="text"
            value={creationName}
            onChange={(e) =>
              dispatch(
                setCreationForm({ name: e.target.value, category: EntityCategoryEnum.FREE, height: creationHeight })
              )
            }
            placeholder="שם הנקודה…"
            className="w-full rounded-lg border border-zinc-700/60 bg-zinc-950/90 px-2 py-1.5 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-600/50"
          />
        </div>

        <div className="mb-2">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            אייקון
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {MARKER_ICONS.map(({ code, label, font }) => {
              const isSelected = selectedIcon === code;
              return (
                <button
                  key={code}
                  type="button"
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-zinc-200 transition ${
                    isSelected
                      ? "border-sky-500/50 bg-sky-950/50 ring-1 ring-sky-500/30"
                      : "border-transparent bg-zinc-800/50 hover:border-zinc-600/60 hover:bg-zinc-800"
                  }`}
                  onClick={() => handleSelectIcon(code)}
                  title={label}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center text-[13px] leading-none"
                    style={{ fontFamily: `${font}, sans-serif` }}
                  >
                    {getMarkerIconChar(code)}
                  </span>
                  <span className="max-w-full truncate text-[8px] font-medium leading-tight text-zinc-500">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={!selectedIcon}
          onClick={handleStartDrawing}
          className="mt-1 w-full rounded-lg bg-sky-600 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          ציור נקודה במפה
        </button>
      </div>
    </div>
  );
};

export default EntityMarkerCreationPanel;
