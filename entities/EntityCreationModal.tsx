import React, { useState, useEffect } from 'react';
import { ENTITY_CATEGORY_OPTIONS } from '../../constants/entityCategories';
import { EntityType } from '../../types';


interface EntityCreationModalProps {
  open: boolean;
  defaultType: EntityType
  onSave: (name: string, category: string) => void;
  onCancel: () => void;
  position?: { x: number; y: number };
  initialName?: string;
}

const EntityCreationModal: React.FC<EntityCreationModalProps> = ({ open, onSave, onCancel, position }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Enter' && name.trim() && category.trim()) {
        e.preventDefault();
        onSave(name, category);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, name, category, onSave, onCancel]);

  if (!open) return null;
  if (position && (typeof position.x !== 'number' || typeof position.y !== 'number')) return null;
  const modalStyle = position
    ? { position: 'absolute' as const, left: position.x, top: position.y, transform: 'translate(-10px, 10px)', zIndex: 1000 }
    : { position: 'absolute' as const, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 };
  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none ">
      <div style={modalStyle} className="pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className=" rounded-xl shadow-xl border border-gray-200/70 p-2 min-w-[180px] bg-[#1e1e1ee0] max-w-[260px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-200">New Entity</h3>
            <button
              onPointerDown={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
              title="Cancel (Esc)">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (name.trim() && category.trim()) {
                onSave(name, category);
              }
            }}
            className="space-y-2">
            <div>
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded "
                value={name}
                onChange={e => {
                  setName(e.target.value);
                }}
                placeholder="Entity name..."
                required
                autoFocus
              />
            </div>
            <div>
              <select
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 bg-white/90 text-xs text-black font-bold appearance-none"
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                }}
                required>
                <option value="" disabled>Select category...</option>
                {ENTITY_CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1 pt-0.5">
              <button
                type="submit"
                disabled={!name.trim() || !category.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 rounded shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                title="Save (Enter)">
                Save
              </button>
              <button
                type="button"
                onPointerDown={onCancel}
                className="px-2 py-1 text-gray-600 hover:text-gray-800 text-gray-200 font-medium border border-gray-300 hover:border-gray-400 rounded transition-all duration-150 hover:bg-gray-50 text-xs"
                title="Cancel (Esc)">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EntityCreationModal; 