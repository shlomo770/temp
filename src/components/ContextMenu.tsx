import React from 'react';

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  entityId: string;
  entityName: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  open,
  x,
  y,
  entityId,
  entityName,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-32"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
        {entityName || `Entity ${entityId}`}
      </div>
      <button
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
};

export default ContextMenu; 