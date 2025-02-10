"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  columns: Column[];
  onColumnUpdate: (columnId: string, width: number | undefined) => void;
  onColumnReorder: (dragIndex: number, hoverIndex: number) => void;
}

const defaultData = [
  { 
    name: 'Task 1', 
    description: 'Implement new feature', 
    status: 'In Progress', 
    priority: 'High',
    assignee: 'John Doe'
  },
  { 
    name: 'Task 2', 
    description: 'Fix bug in login flow', 
    status: 'Open', 
    priority: 'Medium',
    assignee: 'Jane Smith'
  },
  { 
    name: 'Task 3', 
    description: 'Update documentation', 
    status: 'Done', 
    priority: 'Low',
    assignee: 'Bob Wilson'
  }
];

export const TableGroup: React.FC<TableGroupProps> = ({
  groupId,
  onWidthChange,
  getSnapWidth,
  columns: initialColumns,
  onColumnUpdate,
  onColumnReorder
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [data, setData] = useState<any[]>(defaultData);
  const tableRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange");
  const RESIZER_WIDTH = 4; // Width of the resizer handle

  // Update local columns when props change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const addColumn = () => {
    const columnTypes = [
      { header: 'Created At', key: 'createdAt' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Category', key: 'category' },
      { header: 'Tags', key: 'tags' },
      { header: 'Comments', key: 'comments' }
    ];
    
    const nextType = columnTypes[columns.length % columnTypes.length];
    const newColumn: Column = {
      id: `${nextType.key}-${Date.now()}`,
      header: nextType.header,
      accessorKey: nextType.key,
    };
    
    setColumns([...columns, newColumn]);
    setData(data.map((row) => ({ 
      ...row, 
      [newColumn.accessorKey]: getDefaultValueForColumn(newColumn.accessorKey)
    })));
  };

  const getDefaultValueForColumn = (key: string): string => {
    const defaults: { [key: string]: () => string } = {
      createdAt: () => new Date().toLocaleDateString(),
      dueDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      category: () => ['Bug', 'Feature', 'Enhancement', 'Documentation'][Math.floor(Math.random() * 4)],
      tags: () => ['Frontend', 'Backend', 'UI/UX', 'API'][Math.floor(Math.random() * 4)],
      comments: () => `${Math.floor(Math.random() * 10)} comments`
    };
    return defaults[key] ? defaults[key]() : '';
  };

  const addRow = () => {
    const statuses = ['Open', 'In Progress', 'Done', 'Blocked'];
    const priorities = ['High', 'Medium', 'Low'];
    const assignees = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown'];
    
    const newRow = columns.reduce((acc, col) => {
      if (col.accessorKey === 'name') {
        acc[col.accessorKey] = `Task ${data.length + 1}`;
      } else if (col.accessorKey === 'description') {
        acc[col.accessorKey] = `New task description ${data.length + 1}`;
      } else if (col.accessorKey === 'status') {
        acc[col.accessorKey] = statuses[Math.floor(Math.random() * statuses.length)];
      } else if (col.accessorKey === 'priority') {
        acc[col.accessorKey] = priorities[Math.floor(Math.random() * priorities.length)];
      } else if (col.accessorKey === 'assignee') {
        acc[col.accessorKey] = assignees[Math.floor(Math.random() * assignees.length)];
      } else {
        acc[col.accessorKey] = getDefaultValueForColumn(col.accessorKey);
      }
      return acc;
    }, {} as Record<string, string>);
    
    setData([...data, newRow]);
  };

  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    onColumnReorder(dragIndex, hoverIndex);
  };

  const setColumnWidth = (columnId: string, width: number | undefined) => {
    onColumnUpdate(columnId, width);
  };

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumnWidth(columnId, Math.round(newWidth));
  }, [setColumnWidth]);

  const calculateColumnWidths = useMemo(() => {
    // Calculate total fixed width and count auto columns
    const totalFixedWidth = columns.reduce((sum, col) => 
      col.width ? sum + col.width : sum, 0) + (columns.length - 1) * RESIZER_WIDTH;
    const autoColumns = columns.filter(col => !col.width);
    
    // If all columns have fixed widths, use their total width
    if (autoColumns.length === 0) {
      return {
        columns: columns.map(col => ({
          ...col,
          calculatedWidth: col.width || 0
        })),
        totalWidth: totalFixedWidth,
        hasAutoColumns: false
      };
    }

    // If we have auto columns, distribute remaining space
    const remainingWidth = Math.max(0, containerWidth - totalFixedWidth);
    const autoColumnWidth = remainingWidth / autoColumns.length;

    return {
      columns: columns.map(col => ({
        ...col,
        calculatedWidth: col.width || autoColumnWidth
      })),
      totalWidth: containerWidth,
      hasAutoColumns: true
    };
  }, [columns, containerWidth]);

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
            accessorKey={col.accessorKey}
          />
        ),
        accessorKey: col.accessorKey,
        size: col.calculatedWidth,
        minSize: col.width || 0,
        maxSize: col.width,
        meta: {
          style: {
            width: col.width ? `${col.width}px` : undefined,
            minWidth: col.width ? `${col.width}px` : undefined,
            maxWidth: col.width ? `${col.width}px` : undefined,
            position: 'relative',
            paddingRight: `${RESIZER_WIDTH}px`
          }
        }
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="table-group" ref={tableRef}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '1rem' 
        }}>
          <button onClick={addColumn}>Add Column</button>
          <button onClick={addRow}>Add Row</button>
        </div>
        <div style={{
          width: '100%',
          overflowX: 'auto'
        }}>
          <div style={{
            width: calculateColumnWidths.hasAutoColumns ? '100%' : 'fit-content',
            maxWidth: '100%'
          }}>
            <table style={{
              width: calculateColumnWidths.hasAutoColumns ? '100%' : 'fit-content',
              minWidth: 'fit-content',
              tableLayout: "fixed" as const,
              borderSpacing: 0,
              borderCollapse: "collapse" as const
            }}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          width: `${header.getSize()}px`,
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
                            }`}
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
                    ))}
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
      </div>
    </DndProvider>
  );
};
