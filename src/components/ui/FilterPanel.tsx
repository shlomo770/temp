import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { 
  toggleLayer, 
  setFilterPanelOpen, 
  resetFilters, 
  showTargetsOnly
} from '../../store/slices/filterSlice';

interface LayerToggleProps {
  category: 'targets' | 'categories';
  layer: string;
  name: string;
  icon: string;
  visible: boolean;
}

const LayerToggle: React.FC<LayerToggleProps> = React.memo(({ category, layer, name, icon, visible }) => {
  const dispatch = useAppDispatch();
  const [isDisabled, setIsDisabled] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (isDisabled) return;
    
    console.log('🔧 FilterPanel - Toggle clicked:', { category, layer });
    setIsDisabled(true);
    dispatch(toggleLayer({ category, layer }));
    
    // Disable button for 1 second
    setTimeout(() => {
      setIsDisabled(false);
    }, 1000);
  }, [isDisabled, dispatch, category, layer]);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-gray-700">
          {name}
        </span>
      </div>
      <button 
        onPointerDown={handleToggle}
        disabled={isDisabled}
        className={`
          relative inline-flex h-4 w-7 items-center rounded-full
          transition-all duration-200 ease-in-out
          ${visible 
            ? 'bg-blue-500' 
            : 'bg-gray-300'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        `}
      >
        <span className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm
          transition-all duration-200 ease-in-out
          ${visible ? 'translate-x-3.5' : 'translate-x-0.5'}
        `} />
      </button>
    </div>
  );
});

LayerToggle.displayName = 'LayerToggle';

const FilterPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(state => state.filter);

  // Memoize handlers to prevent unnecessary re-renders
  const handleClose = React.useCallback(() => {
    dispatch(setFilterPanelOpen(false));
  }, [dispatch]);

  const handleReset = React.useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  const handleTargetsOnly = React.useCallback(() => {
    dispatch(showTargetsOnly());
  }, [dispatch]);

  // Memoize the panel content to prevent unnecessary re-renders
  const panelContent = React.useMemo(() => {
    if (!filterState.isFilterPanelOpen) return null;

    return (
      <div 
        className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[280px] w-full p-0 overflow-hidden"
        style={{
          minWidth: 240,
          maxWidth: 280,
          width: '100%',
          top: '76px',
          right: '16px',
          maxHeight: '70vh',
          transform: filterState.isFilterPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
          <span className="text-base font-semibold text-gray-900">Layer Filter</span>
          <button
            onPointerDown={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
          {/* Categories Section */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1 mb-2">
              <span>🏷️</span>
              Categories
            </h4>
            <div className="space-y-0.5">
              <LayerToggle 
                category="categories" 
                layer="No-fly zone" 
                name="No-fly Zone" 
                icon="🚫" 
                visible={filterState.categories['No-fly zone']} 
              />
              <LayerToggle 
                category="categories" 
                layer="Allowed zone" 
                name="Allowed Zone" 
                icon="✅" 
                visible={filterState.categories['Allowed zone']} 
              />
              <LayerToggle 
                category="categories" 
                layer="Building" 
                name="Building" 
                icon="🏢" 
                visible={filterState.categories['Building']} 
              />
              <LayerToggle 
                category="categories" 
                layer="Station" 
                name="Station" 
                icon="🚉" 
                visible={filterState.categories['Station']} 
              />
              <LayerToggle 
                category="categories" 
                layer="Parking" 
                name="Parking" 
                icon="🅿️" 
                visible={filterState.categories['Parking']} 
              />
              <LayerToggle 
                category="categories" 
                layer="Other" 
                name="Other" 
                icon="📦" 
                visible={filterState.categories['Other']} 
              />
            </div>
          </div>

          {/* Targets Section */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1 mb-2">
              <span>🎯</span>
              Targets
            </h4>
            <div className="space-y-0.5">
              <LayerToggle 
                category="targets" 
                layer="all" 
                name="All Targets" 
                icon="🎯" 
                visible={filterState.targets.all} 
              />
              <LayerToggle 
                category="targets" 
                layer="friendly" 
                name="Friendly" 
                icon="🟢" 
                visible={filterState.targets.friendly} 
              />
              <LayerToggle 
                category="targets" 
                layer="hostile" 
                name="Hostile" 
                icon="🔴" 
                visible={filterState.targets.hostile} 
              />
              <LayerToggle 
                category="targets" 
                layer="unknown" 
                name="Unknown" 
                icon="🟡" 
                visible={filterState.targets.unknown} 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1">
            <button 
              onPointerDown={handleTargetsOnly}
              className="
                px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md
                hover:bg-blue-200 transition-colors
              "
            >
              🎯 Targets
            </button>
            <button 
              onPointerDown={handleReset}
              className="
                px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md
                hover:bg-gray-200 transition-colors
              "
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>
    );
  }, [filterState, handleClose, handleReset, handleTargetsOnly]);

  return panelContent;
};

export default React.memo(FilterPanel); 