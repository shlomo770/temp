import { FC, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface MissionSavePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** נקרא עם שם המשימה לאחר לחיצה על שמירה */
  onSave: (missionName: string) => void;
  title?: string;
  subtitle?: string;
}

/**
 * טופס שמירת משימה חדשה – מבנה ויזואלי כמו EntityCreationPanel (פאנל כהה, שדה שם, כפתורי פעולה).
 */
const MissionSavePanel: FC<MissionSavePanelProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'שמירת משימה חדשה',
  subtitle = 'הזן שם למשימה ושמור את כל הישויות הנוכחיות במפה',
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-24 top-24 max-h-[80vh] w-[350px] bg-[#1f2937] shadow-lg z-[1000] p-6">
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 z-50"
        aria-label="סגור"
      >
        <FaTimes size={24} />
      </button>

      <div className="h-full overflow-y-auto">
        <div className="w-full p-6 font-sans flex flex-col pt-2">
          <div className="text-center border-b border-gray-600 pb-2 mb-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="mission-save-name" className="block text-sm text-sky-100 font-medium mb-1">
                שם משימה
              </label>
              <input
                id="mission-save-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: משימה_צפון_01"
                className="input-dark w-full"
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                שמור משימה
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MissionSavePanel;
