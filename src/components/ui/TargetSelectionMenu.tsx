import { FC } from 'react';

interface Target {
    id: string;
    type: string;
    friend: boolean;
}

interface TargetSelectionMenuProps {
    open: boolean;
    x: number;
    y: number;
    targets: Target[];
    onClose: () => void;
    onSelectTarget: (targetId: string) => void;
}

const TargetSelectionMenu: FC<TargetSelectionMenuProps> = ({
    open,
    x,
    y,
    targets,
    onClose,
    onSelectTarget
}) => {
    if (!open || targets.length === 0) return null;
    return (
        <>
            <div
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onPointerDown={() => {
                    setTimeout(() => {
                        onClose();
                    }, 100);
                }}
            />
            <div
                className="fixed z-[999] bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48 max-h-64 overflow-y-auto"
                style={{ left: x, top: y }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                    Select Target 
                </div>
                {targets.map((target) => (
                    <button
                        key={target.id}
                        onPointerDown={() => onSelectTarget(target.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                        <div
                            className={`w-3 h-3 rounded-full ${target.friend ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <span className="font-medium">{target.id}</span>
                        <span className="text-gray-500 text-xs">({target.type})</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default TargetSelectionMenu;
