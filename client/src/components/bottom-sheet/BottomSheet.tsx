import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PinnedDronesList } from './PinnedDronesList';
import { HistoryDronesList } from './HistoryDronesList';
import { DroneSearchResults } from './DroneSearchResults';
import { trpc } from '@/lib/trpc';
import { debounce, clamp } from '@/lib/utils';

const COLLAPSED_HEIGHT = 180;
const EXPANDED_HEIGHT_RATIO = 0.75;

export function BottomSheet() {
  const { dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sheetHeight, setSheetHeight] = useState(COLLAPSED_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const isExpanded = sheetHeight > COLLAPSED_HEIGHT + 50;
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * EXPANDED_HEIGHT_RATIO : 600;

  // Debounce search query
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetQuery(searchQuery);
  }, [searchQuery, debouncedSetQuery]);

  // Get all drones query (for when search is focused but empty)
  const allDrones = trpc.drones.getAll.useQuery(undefined, {
    enabled: isSearchFocused,
  });

  // Search drones query (for filtering)
  const searchResults = trpc.drones.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  // Determine which drones to show
  const dronesToShow = debouncedQuery.length > 0 
    ? searchResults.data || [] 
    : allDrones.data || [];
  const isLoadingDrones = debouncedQuery.length > 0 
    ? searchResults.isLoading 
    : allDrones.isLoading;

  // Handle drag start
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
  }, [sheetHeight]);

  // Handle drag move
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const delta = dragStartY.current - clientY;
    const newHeight = clamp(dragStartHeight.current + delta, COLLAPSED_HEIGHT, maxHeight);
    setSheetHeight(newHeight);
  }, [isDragging, maxHeight]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Snap to collapsed or expanded
    const midpoint = (COLLAPSED_HEIGHT + maxHeight) / 2;
    if (sheetHeight < midpoint) {
      setSheetHeight(COLLAPSED_HEIGHT);
      dispatch({ type: 'SET_BOTTOM_SHEET_EXPANDED', payload: false });
    } else {
      setSheetHeight(maxHeight);
      dispatch({ type: 'SET_BOTTOM_SHEET_EXPANDED', payload: true });
    }
  }, [sheetHeight, maxHeight, dispatch]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Toggle expand/collapse on tap
  const handleToggle = () => {
    if (isExpanded) {
      setSheetHeight(COLLAPSED_HEIGHT);
      dispatch({ type: 'SET_BOTTOM_SHEET_EXPANDED', payload: false });
    } else {
      setSheetHeight(maxHeight);
      dispatch({ type: 'SET_BOTTOM_SHEET_EXPANDED', payload: true });
    }
  };

  return (
    <div
      ref={sheetRef}
      className="absolute left-4 right-4 bottom-4 z-20 bg-buzz-dark-card rounded-3xl border border-buzz-dark-border shadow-2xl overflow-hidden safe-area-bottom"
      style={{
        height: sheetHeight,
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleToggle}
      >
        <div className="w-12 h-1.5 bg-buzz-dark-border rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Fleet Command</h2>
        <button className="p-2 hover:bg-buzz-dark-border rounded-lg transition-colors">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 pb-4">
        <Input
          placeholder="Enter Drone ID or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          onFocus={() => {
            setIsSearchFocused(true);
            if (!isExpanded) {
              setSheetHeight(maxHeight);
              dispatch({ type: 'SET_BOTTOM_SHEET_EXPANDED', payload: true });
            }
          }}
          onBlur={() => {
            // Small delay to allow click events on search results to fire first
            setTimeout(() => {
              setIsSearchFocused(false);
              setSearchQuery('');
              setDebouncedQuery('');
            }, 150);
          }}
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" style={{ height: sheetHeight - 130 }}>
        <div className="px-4 pb-4">
          {/* Show drone list when search is focused, otherwise show pinned/history */}
          {isSearchFocused ? (
            <DroneSearchResults
              results={dronesToShow}
              isLoading={isLoadingDrones}
              query={debouncedQuery}
            />
          ) : (
            <>
              {/* Pinned drones */}
              <PinnedDronesList />

              {/* Launch history */}
              <HistoryDronesList />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

