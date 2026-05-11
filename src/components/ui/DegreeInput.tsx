export function DegreeInput({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number | "";
    onChange: (v: number | "") => void;
  }) {
    return (
      <div className="flex-1">
        <label className="text-xs text-slate-400 mb-1 block">
          {label}
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={360}
          step={1}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return onChange("");
            const n = Number(v);
            if (Number.isFinite(n) && n >= 0 && n <= 360) {
              onChange(n);
            }
          }}
          className="input-dark text-center"
          placeholder="0–360"
        />
      </div>
    );
  }