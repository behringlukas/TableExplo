"use client";

import React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
  ColumnResizeMode,
} from "@tanstack/react-table";
import { DraggableColumnHeader } from "./DraggableColumnHeader";
import "./TableGroup.css";

interface Column {
  id: string;
  header: string;
  accessorKey: string;
  width?: number;
}

interface TableGroupProps {
  groupId: number;
  onWidthChange: (width: number, isAdding: boolean) => void;
  getSnapWidth: (currentWidth: number, threshold?: number) => number | null;
}

export const TableGroup: React.FC<TableGroupProps> = ({
  groupId,
  onWidthChange,
  getSnapWidth,
}) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [data, setData] = useState<any[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange");

  useEffect(() => {
    const updateContainerWidth = () => {
      if (tableRef.current) {
        setContainerWidth(tableRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);

    return () => {
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, []);

  const addColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      header: `Column ${columns.length + 1}`,
      accessorKey: `col${columns.length + 1}`,
    };
    setColumns([...columns, newColumn]);
    setData(data.map((row) => ({ ...row, [newColumn.accessorKey]: "" })));
  };

  const addRow = () => {
    const newRow = columns.reduce((acc, col) => {
      acc[col.accessorKey] = "";
      return acc;
    }, {} as Record<string, string>);
    setData([...data, newRow]);
  };

  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const newColumns = [...columns];
    const [reorderedColumn] = newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, reorderedColumn);
    setColumns(newColumns);
  };

  const setColumnWidth = (columnId: string, width: number | undefined) => {
    const oldColumn = columns.find((col) => col.id === columnId);

    // Only update if the width has actually changed
    if (oldColumn?.width !== width) {
      // Remove the old width from shared widths if it exists
      if (oldColumn?.width !== undefined) {
        onWidthChange(oldColumn.width, false);
      }

      // Add the new width to shared widths if it exists
      if (width !== undefined) {
        onWidthChange(width, true);
      }

      setColumns(
        columns.map((col) => (col.id === columnId ? { ...col, width } : col))
      );
    }
  };

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumnWidth(columnId, Math.round(newWidth));
  }, [setColumnWidth]);

  const calculateColumnWidths = useMemo(() => {
    // Calculate total width of fixed columns
    const fixedWidthSum = columns.reduce((sum, col) => 
      sum + (col.width !== undefined ? col.width : 0), 0);
    
    // Count flexible columns (Auto)
    const flexibleColumns = columns.filter(col => col.width === undefined);
    const flexibleCount = flexibleColumns.length;
    
    // Determine if we should show horizontal scroll
    const hasHorizontalScroll = flexibleCount === 0 && fixedWidthSum > containerWidth;
    
    let calculatedColumns;
    if (flexibleCount > 0) {
      // If we have any Auto columns, calculate their width based on remaining space
      const remainingWidth = Math.max(0, containerWidth - fixedWidthSum);
      // Use Math.ceil to prevent rounding down issues
      const flexibleWidth = Math.ceil(remainingWidth / flexibleCount);
      
      calculatedColumns = columns.map(col => ({
        ...col,
        calculatedWidth: col.width !== undefined ? col.width : flexibleWidth,
      }));
    } else {
      calculatedColumns = columns.map(col => ({
        ...col,
        calculatedWidth: col.width!,
      }));
    }

    // Calculate total width
    const totalWidth = flexibleCount > 0 ? containerWidth : fixedWidthSum;

    return {
      columns: calculatedColumns,
      totalWidth,
      hasHorizontalScroll,
      flexibleCount
    };
  }, [columns, containerWidth]);

  const tableStyle = useMemo(() => ({
    width: "100%",
    minWidth: calculateColumnWidths.flexibleCount > 0 ? "100%" : `${calculateColumnWidths.totalWidth}px`,
    maxWidth: calculateColumnWidths.flexibleCount > 0 ? "100%" : "none",
    tableLayout: "fixed" as const,
    borderSpacing: 0,
    borderCollapse: "collapse" as const
  }), [calculateColumnWidths]);

  const tableColumns: ColumnDef<any>[] = useMemo(
    () =>
      calculateColumnWidths.columns.map((col) => ({
        id: col.id,
        header: ({ header }) => (
          <DraggableColumnHeader
            header={col.header}
            index={columns.findIndex(c => c.id === col.id)}
            moveColumn={moveColumn}
            columnId={col.id}
            setColumnWidth={setColumnWidth}
            width={col.width}
          />
        ),
        accessorKey: col.accessorKey,
        size: col.calculatedWidth,
        minSize: 0,
        maxSize: col.width !== undefined ? col.width : undefined,
      })),
    [calculateColumnWidths, moveColumn, setColumnWidth, columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 0,
      enableResizing: true
    },
    onColumnSizingChange: (updater) => {
      const sizing = typeof updater === 'function' ? updater({}) : updater;
      const [columnId, delta] = Object.entries(sizing)[0] || [];
      if (columnId && typeof delta === 'number') {
        handleColumnResize(columnId, delta);
      }
    },
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="table-group">
        <h2 className="group-title">Group {groupId}</h2>
        <button onClick={addColumn} className="add-button">
          Add Column
        </button>
        <button onClick={addRow} className="add-button">
          Add Row
        </button>
        <div
          ref={tableRef}
          className="table-container"
          style={{
            position: "relative",
            overflowX: calculateColumnWidths.hasHorizontalScroll ? "auto" : "hidden",
            width: "100%"
          }}
        >
          <table style={tableStyle}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const width = header.getSize();
                    const hasMatchingWidth = columns.some(
                      (col) =>
                        col.id !== header.column.id && col.width === width
                    );

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: `${width}px`,
                          position: "relative",
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '100%' }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`resizer ${
                              header.column.getIsResizing() ? "isResizing" : ""
                            } ${hasMatchingWidth ? "matching" : ""}`}
                            style={{
                              position: "absolute",
                              right: "-2px",
                              top: 0,
                              height: "100%",
                              width: "4px",
                              background: header.column.getCanResize() ? "rgba(0,0,0,0.5)" : "transparent",
                              cursor: header.column.getCanResize() ? "col-resize" : "default",
                              userSelect: "none",
                              touchAction: "none",
                              zIndex: 1,
                            }}
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndProvider>
  );
};
