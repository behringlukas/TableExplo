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
  setColumnWidth: (columnId: string, width: number | undefined) => void;
  width?: number;
}

export const DraggableColumnHeader: React.FC<DraggableColumnHeaderProps> = ({
  header,
  index,
  moveColumn,
  columnId,
  setColumnWidth,
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempWidth, setTempWidth] = useState<string>(width?.toString() || "Auto");
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

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
    setTempWidth(width !== undefined ? Math.round(width).toString() : "Auto");
  }, [width]);

  const handleConfirm = () => {
    if (tempWidth === "Auto") {
      setColumnWidth(columnId, undefined);
    } else {
      const newWidth = Number(tempWidth);
      if (!isNaN(newWidth)) {
        setColumnWidth(columnId, newWidth);
      }
    }
    setIsOpen(false);
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
      </div>,
      document.body
    );
  };

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
          userSelect: 'none'
        }}
      >
        <span>{header}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '12px',
            color: '#666'
          }}
        >
          {width || "Auto"}
        </button>
      </div>
      {renderPopover()}
    </>
  );
};
