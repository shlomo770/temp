export function CenterModal({
    open,
    onClose,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-10 w-[320px] rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-4">
          {children}
        </div>
      </div>
    );
  }