import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { Target } from '../../store/slices/targetsSlice';
import { formatCoordinates } from '../../utils/coordinates';

interface TargetsTableProps {
  onCenterTarget?: (target: Target) => void;
  onAttackTarget?: (targetId: string) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const TargetsTable: React.FC<TargetsTableProps> = ({ onCenterTarget, onAttackTarget, expanded = false, onToggleExpanded }) => {
  const targets = useAppSelector(state => state.targets);
  const isUTM = useAppSelector(state => state.coordinates.isUTM);
  const utmZone = useAppSelector(state => state.coordinates.utmZone);
  const allTargets = targets.allIds.map(id => targets.byId[id]).filter(Boolean);
  const [localExpanded, setLocalExpanded] = useState(false);

  // Use external expanded if provided, otherwise use local state
  const isExpanded = expanded !== undefined ? expanded : localExpanded;
  const toggleExpanded = onToggleExpanded || (() => setLocalExpanded(!localExpanded));

  // Force re-render every 10 seconds to update timestamps
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'text-gray-600 bg-gray-50';

    switch (type.toLowerCase()) {
      case 'aircraft':
        return 'text-blue-600 bg-blue-50';
      case 'vehicle':
        return 'text-green-600 bg-green-50';
      case 'ship':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'text-gray-600';

    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatSpeed = (speed: number | undefined) => {
    if (speed === undefined || speed === null) return 'N/A';
    return `${speed.toFixed(1)} km/h`;
  };

  const formatCoordinatesLocal = (coordinates: { lng: number; lat: number } | undefined) => {
    if (!coordinates) return 'N/A';
    return formatCoordinates(coordinates, isUTM, utmZone);
  };

  const formatHeading = (heading: number | undefined) => {
    if (heading === undefined || heading === null) return 'N/A';
    return `${heading.toFixed(0)}°`;
  };

  const formatLastUpdate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const shortColumns = [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const fullColumns = [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'position', label: 'Position' },
    { key: 'heading', label: 'Heading' },
    { key: 'speed', label: 'Speed' },
    { key: 'status', label: 'Status' },
    { key: 'lastUpdate', label: 'Last Update' },
    { key: 'actions', label: 'Actions' }
  ];

  const currentColumns = isExpanded ? fullColumns : shortColumns;

  if (allTargets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No targets available
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white/55 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-black/5 p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-medium text-gray-700">Targets</h3>
        <button
          onPointerDown={toggleExpanded}
          className="flex items-center p-1 text-xs bg-blue-100/60 text-blue-700 rounded-md hover:bg-blue-200/60 transition-colors"
          title={isExpanded ? "Collapse columns" : "Expand columns"}
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/30 bg-transparent">
          <thead className="bg-gray-50/60">
            <tr>
              {currentColumns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-200/30">
            {allTargets.map((target, index) => (
              <tr key={target.id || `target-${index}`} className="hover:bg-gray-50/40 transition-colors">
                {/* ID */}
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {target.id || 'N/A'}
                </td>

                {isExpanded && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(target.type)}`}>
                      {target.type || 'Unknown'}
                    </span>
                  </td>
                )}

                {isExpanded && (
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {formatCoordinatesLocal(target.coordinates)}
                  </td>
                )}

                {isExpanded && (
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    <div className="flex items-center">
                      {target.heading !== undefined && target.heading !== null ? (
                        <>
                          <svg
                            className="w-3 h-3 mr-1"
                            style={{ transform: `rotate(${target.heading}deg)` }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          {formatHeading(target.heading)}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </td>
                )}

                {isExpanded && (
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {formatSpeed(target.speed)}
                  </td>
                )}

                {/* Status */}
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span className={`font-medium ${getStatusColor(target.status)}`}>
                    {target.status === 'active' ? 'Active' : 'Disconnected'}
                  </span>
                </td>

                {isExpanded && (
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {formatLastUpdate(target.lastUpdate)}
                  </td>
                )}

                {/* Actions */}
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    {onAttackTarget && (
                      <button
                        onPointerDown={() => onAttackTarget(target.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                        title="Attack target"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <circle cx="12" cy="12" r="3" fill="currentColor" />
                          <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
                          <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
                          <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" />
                          <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                    )}

                    {onCenterTarget && (
                      <button
                        onPointerDown={() => onCenterTarget(target)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Center on map"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M1 12h6m6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TargetsTable; 