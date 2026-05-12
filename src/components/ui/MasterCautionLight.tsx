import { useDispatch, useSelector } from "react-redux";
import { acknowledgeAll, selectMasterCautionOn } from "../../store/slices/faultsSlice";

export function MasterCautionLight() {
  const on = useSelector(selectMasterCautionOn);
  const dispatch = useDispatch();
  return (
    <button
      onClick={() => dispatch(acknowledgeAll())}
      className={
        "px-3 py-1 rounded font-semibold border transition " +
        (on ? "bg-red-600 border-red-400 text-white animate-pulse"
            : "bg-neutral-800 border-neutral-600 text-neutral-300")
      }
      title="לחיצה = אישור כל התקלות הפעילות"
    >
      MASTER CAUTION
    </button>
  );
}
