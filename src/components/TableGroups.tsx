import type React from "react"
import { useState } from "react"
import { TableGroup } from "./TableGroup"
import "./TableGroups.css"

interface ColumnWidth {
  width: number
  count: number
}

interface Column {
  id: string;
  header: string;
  accessorKey: string;
  width?: number;
}

const defaultColumns: Column[] = [
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'description', header: 'Description', accessorKey: 'description' },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'priority', header: 'Priority', accessorKey: 'priority' },
  { id: 'assignee', header: 'Assignee', accessorKey: 'assignee' }
];

interface GroupData {
  id: number;
  columns: Column[];
}

export const TableGroups: React.FC = () => {
  const [groups, setGroups] = useState<GroupData[]>([
    { id: 1, columns: defaultColumns }
  ]);
  const [columnWidths, setColumnWidths] = useState<ColumnWidth[]>([]);

  const addGroup = () => {
    setGroups([...groups, { id: Date.now(), columns: defaultColumns }]);
  };

  const updateSharedWidth = (width: number, isAdding: boolean) => {
    setColumnWidths(prev => {
      const existingIndex = prev.findIndex(w => Math.abs(w.width - width) < 5);
      const newWidths = [...prev];

      if (existingIndex >= 0) {
        if (isAdding) {
          newWidths[existingIndex] = {
            width: width,
            count: newWidths[existingIndex].count + 1
          };
        } else {
          if (newWidths[existingIndex].count <= 1) {
            newWidths.splice(existingIndex, 1);
          } else {
            newWidths[existingIndex] = {
              width: width,
              count: newWidths[existingIndex].count - 1
            };
          }
        }
      } else if (isAdding) {
        newWidths.push({ width, count: 1 });
      }

      return newWidths;
    });
  };

  const updateColumnWidth = (groupId: number, columnId: string, width: number | undefined, applyToAll?: boolean) => {
    setGroups(currentGroups => {
      const newGroups = [...currentGroups];
      const group = newGroups.find(g => g.id === groupId);
      if (!group) return currentGroups;

      const column = group.columns.find(col => col.id === columnId);
      if (!column) return currentGroups;

      const accessorKey = column.accessorKey;

      if (applyToAll) {
        // Update all groups' columns with the same accessorKey
        return newGroups.map(g => ({
          ...g,
          columns: g.columns.map(col => 
            col.accessorKey === accessorKey
              ? { ...col, width }
              : col
          )
        }));
      } else {
        // Update only the specific column in the specific group
        return newGroups.map(g => 
          g.id === groupId
            ? {
                ...g,
                columns: g.columns.map(col =>
                  col.id === columnId
                    ? { ...col, width }
                    : col
                )
              }
            : g
        );
      }
    });
  };

  const getSnapWidth = (currentWidth: number, threshold: number = 10): number | null => {
    if (columnWidths.length === 0) return null;

    const closestWidth = columnWidths.reduce((closest, current) => {
      const currentDiff = Math.abs(current.width - currentWidth);
      const closestDiff = Math.abs(closest.width - currentWidth);
      return currentDiff < closestDiff ? current : closest;
    });

    return Math.abs(closestWidth.width - currentWidth) <= threshold
      ? closestWidth.width
      : null;
  };

  return (
    <div className="table-groups">
      <button onClick={addGroup} className="add-group-button">
        Add Group
      </button>
      {groups.map((group) => (
        <TableGroup
          key={group.id}
          groupId={group.id}
          onWidthChange={updateSharedWidth}
          getSnapWidth={getSnapWidth}
          columns={group.columns}
          onColumnUpdate={(columnId, width, applyToAll) => 
            updateColumnWidth(group.id, columnId, width, applyToAll)
          }
        />
      ))}
    </div>
  );
};
