// import React, { useState } from 'react';
// import { useAppSelector } from '../hooks/useAppSelector';
// import { useAppDispatch } from '../hooks/useAppDispatch';
// import { removeEntity } from '../store/slices/entitiesSlice';
// import { Entity } from '../types';
// import { useWebSocket } from '../hooks/useWebSocket';

// type EntityTreeProps = {
//   onCenterEntity: (entity: Entity) => void;
//   onDeleteEntity?: (entity: Entity) => void;
//   onEditEntity?: (entity: Entity) => void;
// };

// const geometryIcons: Record<string, JSX.Element> = {
//   polygon: <svg className="inline w-3.5 h-3.5 mr-0.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5,3 19,3 21,12 12,21 3,12" stroke="currentColor" fill="none" /></svg>,
//   rectangle: <svg className="inline w-3.5 h-3.5 mr-0.5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" fill="none" /></svg>,
//   circle: <svg className="inline w-3.5 h-3.5 mr-0.5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" fill="none" /></svg>,
//   line: <svg className="inline w-3.5 h-3.5 mr-0.5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" /></svg>,
//   marker: <svg className="inline w-3.5 h-3.5 mr-0.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="10" r="4" stroke="currentColor" fill="none" /><path d="M12 14v7" stroke="currentColor" /></svg>,
// };

// const EntityTree: React.FC<EntityTreeProps> = (props) => {
//   const { onCenterEntity, onDeleteEntity, onEditEntity } = props;
//   const dispatch = useAppDispatch();
//   const { sendMessage } = useWebSocket();
//   const entities = useAppSelector(state => Object.values(state.entities.byId));
//   const [search, setSearch] = useState('');

//   const handleEntitySelect = (entityId: string) => {
//     void entityId;
//   };

//   const handleEntityDelete = (entityId: string) => {
//     void entityId;
//   };

//   // Group entities by logical type (category)
//   const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
//     const type = entity.properties?.type || 'Uncategorized';
//     if (!acc[type]) acc[type] = [];
//     acc[type].push(entity);
//     return acc;
//   }, {});

//   // Collapsible state
//   const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
//   const toggleCategory = (type: string) => {
//     setOpenCategories(prev => ({ ...prev, [type]: !prev[type] }));
//   };

//   return (
//     <div className="w-full max-w-[200px]">
//       <div className="mb-1 px-1">
//         <input
//           type="text"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           placeholder="Search..."
//           className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white/80"
//         />
//       </div>
//       {Object.entries(grouped)
//         .filter(([type, ents]) => {
//           const q = search.trim().toLowerCase();
//           if (!q) return true;
//           // Show category if its name matches or any entity inside matches
//           if (type.toLowerCase().includes(q)) return true;
//           return ents.some(entity => (entity.properties?.name || '').toLowerCase().includes(q));
//         })
//         .map(([type, ents]) => {
//           const q = search.trim().toLowerCase();
//           const filteredEnts = q
//             ? ents.filter(entity =>
//                 type.toLowerCase().includes(q) ||
//                 (entity.properties?.name || '').toLowerCase().includes(q)
//               )
//             : ents;
//           return (
//             <div key={type} className="mb-1">
//               <button
//                 className="flex items-center w-full px-1 py-0.5 bg-gray-100 rounded-t text-xs font-medium text-gray-800 border-b border-gray-200 focus:outline-none hover:bg-gray-200 transition"
//                 onClick={() => toggleCategory(type)}
//                 style={{ minHeight: 20 }}
//               >
//                 <span className="mr-0.5">
//                   {openCategories[type] ? (
//                     <svg className="inline w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.584l3.71-3.354a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
//                   ) : (
//                     <svg className="inline w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.584 10 7.23 6.29a.75.75 0 111.06-1.02l3.85 4.25a.75.75 0 010 1.02l-3.85 4.25a.75.75 0 01-1.06-0.02z" clipRule="evenodd" /></svg>
//                   )}
//                 </span>
//                 <span className="truncate text-xs flex-1">{type}</span>
//                 <span className="text-gray-400 font-normal text-xs ml-1">{filteredEnts.length}</span>
//               </button>
//               {openCategories[type] && filteredEnts.length > 0 && (
//                 <ul className="divide-y divide-gray-100 bg-white rounded-b">
//                   {filteredEnts.map(entity => (
//                     <li key={entity.id} className="flex items-center px-1 py-0.5 hover:bg-gray-50 group cursor-pointer text-xs" style={{ minHeight: 18 }}>
//                       <span className="mr-0.5">{geometryIcons[entity.type] || null}</span>
//                       <span className="flex-1 truncate text-xs" onClick={() => onCenterEntity(entity)} title={entity.properties?.name || ''}>
//                         {entity.properties?.name || 'No name'}
//                       </span>
//                       {/* Edit button */}
//                       <button
//                         className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-colors"
//                         title="Edit"
//                         onClick={e => {
//                           e.stopPropagation();
//                           if (onEditEntity) {
//                             onEditEntity(entity);
//                           }
//                         }}
//                       >
//                         <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
//                         </svg>
//                       </button>
//                       {/* Delete button */}
//                       <button
//                         className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
//                         title="Delete"
//                         onClick={e => {
//                           e.stopPropagation();
//                           if (onDeleteEntity) {
//                             onDeleteEntity(entity);
//                           } else {
//                             if (entity.category !== 'FREE') {
//                               sendMessage("ENTITY_DELETED", { entityId: entity.id });
//                             }
//                             dispatch(removeEntity(entity.id));
//                           }
//                         }}
//                       >
//                         <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                       </button>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           );
//         })}
//       {/* No results */}
//       {Object.entries(grouped).filter(([type, ents]) => {
//         const q = search.trim().toLowerCase();
//         if (!q) return true;
//         if (type.toLowerCase().includes(q)) return true;
//         return ents.some(entity => (entity.properties?.name || '').toLowerCase().includes(q));
//       }).length === 0 && (
//         <div className="text-xs text-gray-400 px-1 py-2 text-center">No results found</div>
//       )}
//     </div>
//   );
// };

// export default EntityTree; 