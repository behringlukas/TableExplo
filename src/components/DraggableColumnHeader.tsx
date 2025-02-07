"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import ReactDOM from "react-dom";

interface DraggableColumnHeaderProps {
  header: string;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  columnId: string;
  setColumnWidth: (columnId: string, width: number | undefined, applyToAll?: boolean) => void;
  width?: number;
  accessorKey: string;
}

export const DraggableColumnHeader: React.FC<DraggableColumnHeaderProps> = ({
  header,
  index,
  moveColumn,
  columnId,
  setColumnWidth,
  width,
  accessorKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempWidth, setTempWidth] = useState<string>(width?.toString() || "Auto");
  const [applyToAll, setApplyToAll] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const lastAppliedWidth = useRef<number | undefined>(width);
  const isResizing = useRef(false);

  // Persist the checkbox state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`columnApplyAll_${accessorKey}`);
    if (savedState !== null) {
      setApplyToAll(savedState === 'true');
    }
  }, [accessorKey]);

  // Save checkbox state when it changes
  useEffect(() => {
    localStorage.setItem(`columnApplyAll_${accessorKey}`, applyToAll.toString());
  }, [applyToAll, accessorKey]);

  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: { index, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover: (draggedItem: { index: number; columnId: string }) => {
      if (draggedItem.index !== index) {
        moveColumn(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  useEffect(() => {
    const updatePopoverPosition = () => {
      if (headerRef.current && isOpen) {
        const rect = headerRef.current.getBoundingClientRect();
        setPopoverPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    };

    if (isOpen) {
      updatePopoverPosition();
      window.addEventListener('scroll', updatePopoverPosition);
      window.addEventListener('resize', updatePopoverPosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePopoverPosition);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isResizing.current) {
      setTempWidth(width !== undefined ? Math.round(width).toString() : "Auto");
      lastAppliedWidth.current = width;
    }
  }, [width]);

  const handleConfirm = () => {
    let newWidth: number | undefined;
    
    if (tempWidth === "Auto") {
      newWidth = undefined;
    } else {
      const parsedWidth = Number(tempWidth);
      if (!isNaN(parsedWidth)) {
        newWidth = parsedWidth;
      } else {
        return; // Invalid width, don't proceed
      }
    }

    // Always use the new width (or current width if not changed) when applying
    const widthToApply = newWidth ?? width;
    setColumnWidth(columnId, widthToApply, applyToAll);
    lastAppliedWidth.current = widthToApply;
    setIsOpen(false);
  };

  const handleResize = useCallback((newWidth: number) => {
    isResizing.current = true;
    const roundedWidth = Math.round(newWidth);
    
    if (roundedWidth !== lastAppliedWidth.current) {
      // During resize, always apply with current applyToAll setting
      setColumnWidth(columnId, roundedWidth, applyToAll);
      lastAppliedWidth.current = roundedWidth;
      // Update the temp width to match the current width
      setTempWidth(roundedWidth.toString());
    }
  }, [columnId, setColumnWidth, applyToAll]);

  // Handle checkbox change
  const handleApplyToAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApplyToAll = e.target.checked;
    setApplyToAll(newApplyToAll);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "Auto" || value === "") {
      setTempWidth("Auto");
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setTempWidth(value);
      }
    }
  };

  // Reset isResizing when mouse is released
  useEffect(() => {
    const handleMouseUp = () => {
      isResizing.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const renderPopover = () => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
      <div
        className="column-width-popover"
        style={{
          position: 'fixed',
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={tempWidth}
              onChange={handleInputChange}
              placeholder="Auto"
              style={{ 
                width: '60px',
                padding: '4px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleConfirm}
              style={{
                padding: '4px 8px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '12px',
            color: '#666',
            userSelect: 'none',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={handleApplyToAllChange}
            />
            Apply to all "{accessorKey}" columns
          </label>
        </div>
      </div>,
      document.body
    );
  };

  const renderResizer = () => (
    <div
      style={{
        position: "absolute",
        right: "0",
        top: 0,
        height: "100%",
        width: "4px",
        cursor: "col-resize",
        userSelect: "none",
        touchAction: "none",
        background: "rgba(0, 0, 0, 0.2)",
        transition: "background-color 0.2s",
        zIndex: 1
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
      }}
    />
  );

  return (
    <>
      <div
        ref={(node) => {
          headerRef.current = node;
          drag(drop(node));
        }}
        style={{ 
          opacity: isDragging ? 0.5 : 1,
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          userSelect: 'none',
          width: '100%',
          position: 'relative'
        }}
      >
        <div style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginRight: '8px',
          flex: '1'
        }}>
          {header}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '12px',
            color: '#666',
            whiteSpace: 'nowrap',
            minWidth: 'fit-content'
          }}
        >
          {width || "Auto"}
        </button>
        {renderResizer()}
      </div>
      {renderPopover()}
    </>
  );
};
