// import React, { useState } from 'react';
// import { useAppSelector } from '../hooks/useAppSelector';
// import { useAppDispatch } from '../hooks/useAppDispatch';
// import { updateEntity, removeEntity } from '../store/slices/entitiesSlice';
// import { Entity, EntityType } from '../types';
// import { useWebSocket } from '../hooks/useWebSocket';

// const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
//   polygon: 'Polygon',
//   line: 'Line',
//   rectangle: 'Rectangle',
//   circle: 'Circle',
//   marker: 'Marker',
//   ellipse: 'Ellipse',
//   sector: 'Sector',
//   target: 'Target',
//   measure: 'Measure',
// };

// const EntityEditor: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const { sendMessage } = useWebSocket();
//   const { selectedId, byId } = useAppSelector(state => state.entities);
//   const selectedEntity = selectedId ? byId[selectedId] : null;

//   // Form state
//   const [name, setName] = useState('');
//   const [type, setType] = useState<EntityType>('polygon');
//   const [showForm, setShowForm] = useState(true);

//   React.useEffect(() => {
//     if (selectedEntity) {
//       setName(selectedEntity.properties?.name || '');
//       setType(selectedEntity.type);
//       setShowForm(!selectedEntity.properties?.name); // Show form if no name
//     }
//   }, [selectedId]);

//   if (!selectedEntity) {
//     return (
//       <div className="bg-white shadow-lg rounded-lg p-4 h-full">
//         <h2 className="text-lg font-semibold text-gray-900 mb-4">Entity Editor</h2>
//         <div className="text-center py-8">
//           <div className="text-gray-400 text-4xl mb-4">✏️</div>
//           <p className="text-gray-500 text-sm">Select an entity to edit</p>
//         </div>
//       </div>
//     );
//   }

//   // Handle save
//   const handleSave = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim()) return;
//     dispatch(updateEntity({
//       id: selectedEntity.id,
//       properties: { ...selectedEntity.properties, name },
//       type,
//     }));
//     setShowForm(false);
//   };

//   // Handle cancel
//   const handleCancel = () => {
//     if (selectedEntity.category !== 'FREE') {
//       sendMessage("ENTITY_DELETED", { entityId: selectedEntity.id });
//     }
//     dispatch(removeEntity(selectedEntity.id));
//     setShowForm(false);
//   };

//   if (showForm) {
//     return (
//       <div className="bg-white shadow-lg rounded-lg p-4 h-full flex flex-col justify-center items-center">
//         <form onSubmit={handleSave} className="w-full max-w-xs space-y-4">
//           <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">Configure New Entity</h2>
//           <div>
//             <label className="block text-xs text-gray-600 mb-1">Entity Name</label>
//             <input
//               className="w-full border rounded px-2 py-1"
//               value={name}
//               onChange={e => setName(e.target.value)}
//               required
//               autoFocus
//             />
//           </div>
//           <div>
//             <label className="block text-xs text-gray-600 mb-1">Entity Type</label>
//             <select
//               className="w-full border rounded px-2 py-1"
//               value={type}
//               onChange={e => setType(e.target.value as EntityType)}
//             >
//               {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
//                 <option key={key} value={key}>{label}</option>
//               ))}
//             </select>
//           </div>
//           <div className="flex gap-2 justify-center">
//             <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">Save</button>
//             <button type="button" className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={handleCancel}>Cancel</button>
//           </div>
//         </form>
//       </div>
//     );
//   }

//   // Show entity info and style controls as before
//   const style = selectedEntity.properties?.style || {};

//   // Style change handler
//   const handleStyleChange = (property: string, value: string | number) => {
//     if (!selectedEntity) return;
//     const updatedStyle = {
//       ...selectedEntity.properties?.style,
//       [property]: value
//     };
//     dispatch(updateEntity({
//       id: selectedEntity.id,
//       properties: {
//         ...selectedEntity.properties,
//         style: updatedStyle,
//       }
//     }));
//   };

//   return (
//     <div className="bg-white shadow-lg rounded-lg p-4 h-full overflow-y-auto">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold text-gray-900">Entity Editor</h2>
//         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//           {ENTITY_TYPE_LABELS[selectedEntity.type]}
//         </span>
//       </div>
//       <div className="space-y-4">
//         <div className="bg-gray-50 p-3 rounded-md">
//           <h3 className="text-sm font-medium text-gray-700 mb-2">Entity Details</h3>
//           <div className="space-y-1 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Name:</span>
//               <span className="font-mono text-xs">{selectedEntity.properties?.name || '-'}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Type:</span>
//               <span className="capitalize">{ENTITY_TYPE_LABELS[selectedEntity.type]}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Points:</span>
//               <span>{selectedEntity.coordinates.length}</span>
//             </div>
//           </div>
//         </div>
//         {/* Style Controls */}
//         <div>
//           <h3 className="text-sm font-medium text-gray-700 mb-2">Style Properties</h3>
//           <div className="space-y-3">
//             {/* Fill Color */}
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Fill Color</label>
//               <input
//                 type="color"
//                 value={style.fillColor || '#3b82f6'}
//                 onChange={(e) => handleStyleChange('fillColor', e.target.value)}
//                 className="w-full h-8 border rounded"
//               />
//             </div>
            
//             {/* Stroke Color */}
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Stroke Color</label>
//               <input
//                 type="color"
//                 value={style.strokeColor || '#1e40af'}
//                 onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
//                 className="w-full h-8 border rounded"
//               />
//             </div>
            
//             {/* Fill Opacity */}
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Fill Opacity</label>
//               <input
//                 type="range"
//                 min="0"
//                 max="1"
//                 step="0.1"
//                 value={style.fillOpacity || 0.3}
//                 onChange={(e) => handleStyleChange('fillOpacity', Number(e.target.value))}
//                 className="w-full"
//               />
//               <span className="text-xs text-gray-500">{style.fillOpacity || 0.3}</span>
//             </div>
            
//             {/* Stroke Width */}
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
//               <input
//                 type="range"
//                 min="1"
//                 max="10"
//                 step="1"
//                 value={style.strokeWidth || 2}
//                 onChange={(e) => handleStyleChange('strokeWidth', Number(e.target.value))}
//                 className="w-full"
//               />
//               <span className="text-xs text-gray-500">{style.strokeWidth || 2}px</span>
//             </div>
            
//             {/* Stroke Opacity */}
//             <div>
//               <label className="block text-xs text-gray-600 mb-1">Stroke Opacity</label>
//               <input
//                 type="range"
//                 min="0"
//                 max="1"
//                 step="0.1"
//                 value={style.strokeOpacity || 1}
//                 onChange={(e) => handleStyleChange('strokeOpacity', Number(e.target.value))}
//                 className="w-full"
//               />
//               <span className="text-xs text-gray-500">{style.strokeOpacity || 1}</span>
//             </div>
//           </div>
//         </div>
        
//         {/* Actions */}
//         <div className="pt-4 border-t">
//           <button
//             onClick={() => {
//               if (selectedEntity.category !== 'FREE') {
//                 sendMessage("ENTITY_DELETED", { entityId: selectedEntity.id });
//               }
//               dispatch(removeEntity(selectedEntity.id));
//             }}
//             className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
//           >
//             Delete Entity
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EntityEditor; 