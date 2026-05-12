// import { useEffect, useState, FC, useRef } from 'react';
// import { useAppSelector } from '../../../../hooks/useAppSelector';
// import TargetLabel from './TargetLabel';

// interface TargetsLayerProps {
//   map: any;
//   showLabels?: boolean;
// }

// const TargetsLayer: FC<TargetsLayerProps> = ({ map, showLabels = true }) => {
//   const targetsData = useAppSelector(state => ({
//     byId: state.targets.byId,
//     allIds: state.targets.allIds
//   }), (left, right) => {
//     if (left.allIds.length !== right.allIds.length) return false;
//     for (const id of left.allIds) {
//       const leftTarget = left.byId[id];
//       const rightTarget = right.byId[id];
//       if (!leftTarget || !rightTarget) return false;
//       if (leftTarget.lastUpdate !== rightTarget.lastUpdate) return false;
//       if (leftTarget.coordinates.lat !== rightTarget.coordinates.lat ||
//         leftTarget.coordinates.lng !== rightTarget.coordinates.lng) return false;
//       if (leftTarget.heading !== rightTarget.heading) return false;
//       if (leftTarget.isRecommended !== rightTarget.isRecommended) return false;
//     }
//     return true;
//   });

//   const targetsDataRef = useRef(targetsData);
//   const lastRenderRef = useRef<number>(0);
//   const [throttledData, setThrottledData] = useState(targetsData);
//   const RENDER_THROTTLE_MS = 100;
//   useEffect(() => {
//     targetsDataRef.current = targetsData;
//     const now = Date.now();
//     if (now - lastRenderRef.current >= RENDER_THROTTLE_MS) {
//       setThrottledData(targetsData);
//       lastRenderRef.current = now;
//     }
//   }, [targetsData]);
//   return (
//     <>
//       {showLabels && throttledData.allIds.map(targetId => {
//         const target = throttledData.byId[targetId];
//         if (!target || !target.coordinates) return null;
//         return (
//           <TargetLabel
//             key={targetId}
//             target={{
//               id: target.id,
//               name: `Target ${target.id}`,
//               coordinates: target.coordinates,
//               type: target.type as string,
//               friend: target.friend || false,
//               speed: target.speed || 0,
//               heading: target.heading || 0
//             }}
//             map={map}
//             hasOverlap={false}
//           />
//         );
//       })}
//     </>
//   );
// };

// export default TargetsLayer;
