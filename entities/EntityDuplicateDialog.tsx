import React, { FC } from "react";
import { ENTITY_CATEGORY_OPTIONS } from "../../constants/entityCategories";

export type EntityDuplicateDialogProps = {
  duplicateName: string;
  duplicateCategory: string;
  onDuplicateNameChange: (v: string) => void;
  onDuplicateCategoryChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

const EntityDuplicateDialog: FC<EntityDuplicateDialogProps> = ({
  duplicateName,
  duplicateCategory,
  onDuplicateNameChange,
  onDuplicateCategoryChange,
  onCancel,
  onSave,
}) => (
  <div className="fixed left-[340px] top-24 z-[1000] w-[330px] rounded border border-gray-700/70 bg-[#1f2937] p-5 shadow-lg">
    <div className="mb-4 border-b border-gray-600 pb-2 text-center">
      <h3 className="text-lg font-semibold text-white">שכפול ישות</h3>
    </div>
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium text-sky-100">שם חדש</label>
      <input
        type="text"
        value={duplicateName}
        onChange={(e) => onDuplicateNameChange(e.target.value)}
        className="input-dark w-full"
        autoFocus
      />
    </div>
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-sky-100">קטגוריה</label>
      <select
        value={duplicateCategory}
        onChange={(e) => onDuplicateCategoryChange(e.target.value)}
        className="input-dark w-full"
      >
        {ENTITY_CATEGORY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
      >
        ביטול
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!duplicateName.trim()}
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        שמור שכפול
      </button>
    </div>
  </div>
);

export default EntityDuplicateDialog;
