import { FC, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { PiPolygonFill } from "react-icons/pi";
import { FaCircleNotch } from "react-icons/fa";
import { FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { addEntity, setDrawingMode, setCreationForm } from '../../store/slices/entitiesSlice';
import { setMode } from "../../store/slices/drawSlice";
import { DegreeInput } from '../ui/DegreeInput';
import { ENTITY_CATEGORY_OPTIONS } from '../../constants/entityCategories';
import { EntityFormCategory } from '../../enums/entityCategory.enum';
import { sectorCoordinatesFromAngles } from '../../utils/radarSector';
import { buildNewEntity } from '../../services/entities/EntityGeometryService';
import { WebSocketService } from '../../services/webSocket/WebSocketService';
import { WsMessageName } from '../../enums/ws.enum';
import { buildSaveEntityPayload } from '../../services/webSocket/saveEntityMessage';

interface EntityCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** נקבע בעת פתיחה ממסך Mission DE — טאב קטגוריה */
  presetCategory?: string | null;
}

const TABBOZON_CATEGORY = 'TABBOZON';
const compactFieldClass = "w-full px-2 py-1 rounded bg-gray-800 text-white text-xs border border-gray-600 focus:outline-none focus:border-sky-500";

const EntityCreationPanel: FC<EntityCreationPanelProps> = ({ isOpen, onClose, presetCategory }) => {
  const dispatch = useAppDispatch();
  const [showTabbozonForm, setShowTabbozonForm] = useState(false);
  const [angleFrom, setAngleFrom] = useState<number | ''>('');
  const [angleTo, setAngleTo] = useState<number | ''>('');
  const [radius, setRadius] = useState<number | ''>(1500);
  const creationName = useAppSelector((s) => s.entities.creationName);
  const creationCategory = useAppSelector((s) => s.entities.creationCategory);
  const creationHeight = useAppSelector((s) => s.entities.creationHeight);
  const myPosition = useAppSelector((s) => s.myPosition.coordinates);

  useEffect(() => {
    if (!isOpen || presetCategory == null || String(presetCategory).trim() === "") return;
    dispatch(setCreationForm({ category: String(presetCategory).trim() }));
  }, [isOpen, presetCategory, dispatch]);

  const canSelectCirclePolygonEllipse = Boolean(creationName.trim() && creationCategory);
  const canSelectEllipse = canSelectCirclePolygonEllipse && creationCategory !== EntityFormCategory.FIZ;
  const canSelectPolyline = Boolean(creationName.trim()) && creationCategory === EntityFormCategory.FREE;
  const canCreateTabbozon =
    Number.isFinite(angleFrom) &&
    Number.isFinite(angleTo) &&
    Number.isFinite(radius) &&
    Number(radius) > 0 &&
    Number.isFinite(myPosition?.lng) &&
    Number.isFinite(myPosition?.lat);

  const handleClose = () => {
    dispatch(setCreationForm({ name: '', category: EntityFormCategory.FREE, height: 0 }));
    setShowTabbozonForm(false);
    setAngleFrom('');
    setAngleTo('');
    setRadius(1500);
    onClose();
  };

  /** סגירת הפאנל בלי איפוס שם/קטגוריה – כדי שסיום הציור יקרא את הערכים הנכונים מה-store */
  const closePanelOnly = () => {
    setShowTabbozonForm(false);
    onClose();
  };

  const handleCreateEntity = (type: 'circle' | 'polygon' | 'line' | 'ellipse' | 'sector') => {
    if (type === 'sector') {
      setShowTabbozonForm(true);
      return;
    }
    if ((type === 'circle' || type === 'polygon' || type === 'ellipse') && !canSelectCirclePolygonEllipse) {
      return;
    }
    if (type === 'ellipse' && creationCategory === EntityFormCategory.FIZ) {
      return;
    }
    if (type === 'line') {
      if (creationCategory !== EntityFormCategory.FREE) return;
      dispatch(setCreationForm({ name: creationName, category: EntityFormCategory.FREE, height: creationHeight }));
    }
    const entityType = type === 'ellipse' ? 'ellipse' : type;
    dispatch(setDrawingMode(entityType as any));
    dispatch(setMode(type as any));
    closePanelOnly();
  };

  const handleCreateTabbozonFromForm = () => {
    if (!canCreateTabbozon) return;

    const center = { lng: myPosition.lng, lat: myPosition.lat };
    const coordinates = sectorCoordinatesFromAngles(center, Number(radius), Number(angleFrom), Number(angleTo))
      .map((p) => ({ ...p, alt: Number(creationHeight) || 0 }));
    const name = creationName.trim() || 'Tabbozon';
    const category = TABBOZON_CATEGORY;
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const newEntity = buildNewEntity(entityId, name, category, 'sector', coordinates);

    dispatch(addEntity(newEntity));
    const payload = buildSaveEntityPayload(newEntity.id, newEntity.category, newEntity.type, newEntity.coordinates ?? []);
    if (payload) {
      WebSocketService.getInstance().sendMessage(WsMessageName.SaveEntity, payload);
    }

    dispatch(setCreationForm({ name: '', category: EntityFormCategory.FREE, height: 0 }));
    setShowTabbozonForm(false);
    setAngleFrom('');
    setAngleTo('');
    setRadius(1500);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-24 top-24 max-h-[80vh] w-[340px] bg-[#1f2937] shadow-lg z-[1000] p-4">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 z-50"
        type="button">
        <FaTimes size={24} />
      </button>

      <div className="h-full overflow-y-auto">
        <div className="w-full p-4 font-sans flex flex-col">
          <div className="text-center border-b border-gray-600 pb-2 mb-4">
            <h3 className="text-xl font-semibold text-white">Create new area</h3>
          </div>

          {!showTabbozonForm ? (
            <>
              <div className="mb-2">
                <label className="block text-xs text-sky-100 font-medium mb-1">שם</label>
                <input
                  type="text"
                  value={creationName}
                  onChange={(e) => dispatch(setCreationForm({ name: e.target.value, category: creationCategory, height: creationHeight }))}
                  placeholder="Entity name..."
                  className={compactFieldClass}
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs text-sky-100 font-medium mb-1">גובה (מטר)</label>
                <input
                  type="number"
                  step={1}
                  value={creationHeight}
                  onChange={(e) => dispatch(setCreationForm({
                    name: creationName,
                    category: creationCategory,
                    height: e.target.value === '' ? 0 : Number(e.target.value)
                  }))}
                  className={compactFieldClass}
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs text-sky-100 font-medium mb-1">קטגוריה</label>
                <select
                  value={creationCategory}
                  onChange={(e) => dispatch(setCreationForm({ name: creationName, category: e.target.value, height: creationHeight }))}
                  className={compactFieldClass}>
                  {ENTITY_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-xs text-sky-100 font-medium mb-1.5">Shape</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canSelectCirclePolygonEllipse}
                    className={`flex flex-col items-center gap-1 py-2 rounded text-white transition-colors ${canSelectCirclePolygonEllipse ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-70'}`}
                    onClick={() => handleCreateEntity('circle')}
                    title={!canSelectCirclePolygonEllipse ? 'נא להזין שם ולבחור קטגוריה' : undefined}>
                    <FaCircleNotch size={22} />
                    <span className="text-xs">Circle</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canSelectCirclePolygonEllipse}
                    className={`flex flex-col items-center gap-1 py-2 rounded text-white transition-colors ${canSelectCirclePolygonEllipse ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-70'}`}
                    onClick={() => handleCreateEntity('polygon')}
                    title={!canSelectCirclePolygonEllipse ? 'נא להזין שם ולבחור קטגוריה' : undefined}>
                    <PiPolygonFill size={22} />
                    <span className="text-xs">Polygon</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canSelectEllipse}
                    className={`flex flex-col items-center gap-1 py-2 rounded text-white transition-colors ${canSelectEllipse ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-70'}`}
                    onClick={() => handleCreateEntity('ellipse')}
                    title={!canSelectEllipse ? (creationCategory === EntityFormCategory.FIZ ? 'בקטגוריה FIZ לא ניתן ליצור Ellipse' : 'נא להזין שם ולבחור קטגוריה') : undefined}>
                    <FaEllipsisH size={22} />
                    <span className="text-xs">Ellipse</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canSelectPolyline}
                    className={`flex flex-col items-center gap-1 py-2 rounded text-white transition-colors ${canSelectPolyline ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-70'}`}
                    onClick={() => handleCreateEntity('line')}
                    title={!canSelectPolyline ? 'Polyline זמין רק בקטגוריה FREE' : undefined}>
                    <PiPolygonFill size={22} />
                    <span className="text-xs">Polyline</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    onClick={() => handleCreateEntity('sector')}>
                    <FaChartPie size={22} />
                    <span className="text-xs">Tabbozon</span>
                  </button>
                </div>
              </div>
            </>
          ) : showTabbozonForm ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-sky-100 font-medium">Tabbozon (ממיקום הגוף)</label>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white text-sm"
                  onClick={() => setShowTabbozonForm(false)}>
                  חזרה
                </button>
              </div>
              <div className="flex gap-2">
                <DegreeInput label="מעלה מ-" value={angleFrom} onChange={setAngleFrom} />
                <DegreeInput label="מעלה עד" value={angleTo} onChange={setAngleTo} />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">רדיוס (מ)</label>
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={radius}
                  onChange={(e) => setRadius(e.target.value === '' ? '' : +e.target.value)}
                  className={compactFieldClass}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">קטגוריה</label>
                <input
                  type="text"
                  readOnly
                  value={TABBOZON_CATEGORY}
                  className={`${compactFieldClass} text-slate-300`}
                />
              </div>
              <button
                type="button"
                disabled={!canCreateTabbozon}
                onClick={handleCreateTabbozonFromForm}
                className={`w-full rounded px-3 py-2 text-sm font-medium transition-colors ${canCreateTabbozon ? 'bg-sky-600 text-white hover:bg-sky-500' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-70'}`}
                title={!canCreateTabbozon ? 'יש למלא זוויות/רדיוס ולוודא שיש מיקום גוף תקין' : undefined}
              >
                צור Tabbozon
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EntityCreationPanel;
