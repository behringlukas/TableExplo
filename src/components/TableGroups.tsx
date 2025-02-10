import type React from "react";
import { useState } from "react";
import { TableGroup } from "./TableGroup";
import "./TableGroups.css";

interface ColumnWidth {
  width: number;
  count: number;
}

interface Column {
  id: string;
  header: string;
  accessorKey: string;
  width?: number;
}

const defaultColumns: Column[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "description", header: "Description", accessorKey: "description" },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "priority", header: "Priority", accessorKey: "priority" },
  { id: "assignee", header: "Assignee", accessorKey: "assignee" },
];

interface GroupData {
  id: number;
  columns: Column[];
  synced: boolean;
  name: string;
  hasMismatchWarning?: boolean;
}

export const TableGroups: React.FC = () => {
  const [groups, setGroups] = useState<GroupData[]>([
    {
      id: 1,
      columns: defaultColumns.map((col) => ({ ...col })),
      synced: false,
      name: "Group 1",
    },
  ]);
  const [columnWidths, setColumnWidths] = useState<ColumnWidth[]>([]);
  const [lastApplyToAll, setLastApplyToAll] = useState(false);

  const addGroup = () => {
    // Create a fresh copy of columns without any width property
    const freshColumns = defaultColumns.map(({ width, ...rest }) => rest);
    const newGroupId = Date.now();
    setGroups([
      ...groups,
      {
        id: newGroupId,
        columns: freshColumns,
        synced: false,
        name: `Group ${groups.length + 1}`,
      },
    ]);
  };

  const checkColumnMismatch = (groups: GroupData[]) => {
    const syncedGroups = groups.filter((g) => g.synced);
    if (syncedGroups.length < 2) return groups;

    // Get all unique accessorKeys from synced groups
    const allKeys = new Set<string>();
    syncedGroups.forEach((group) => {
      group.columns.forEach((col) => allKeys.add(col.accessorKey));
    });

    // Check each synced group for missing columns
    return groups.map((group) => {
      if (!group.synced) return { ...group, hasMismatchWarning: false };

      const groupKeys = new Set(group.columns.map((col) => col.accessorKey));
      const hasMismatch = Array.from(allKeys).some(
        (key) => !groupKeys.has(key)
      );

      return { ...group, hasMismatchWarning: hasMismatch };
    });
  };

  const toggleGroupSync = (groupId: number) => {
    setGroups((currentGroups) => {
      const newGroups = currentGroups.map((group) =>
        group.id === groupId ? { ...group, synced: !group.synced } : group
      );
      return checkColumnMismatch(newGroups);
    });
  };

  const updateGroupName = (groupId: number, newName: string) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId ? { ...group, name: newName } : group
      )
    );
  };

  const updateSharedWidth = (width: number, isAdding: boolean) => {
    setColumnWidths((prev) => {
      const existingIndex = prev.findIndex(
        (w) => Math.abs(w.width - width) < 5
      );
      const newWidths = [...prev];

      if (existingIndex >= 0) {
        if (isAdding) {
          newWidths[existingIndex] = {
            width: width,
            count: newWidths[existingIndex].count + 1,
          };
        } else {
          if (newWidths[existingIndex].count <= 1) {
            newWidths.splice(existingIndex, 1);
          } else {
            newWidths[existingIndex] = {
              width: width,
              count: newWidths[existingIndex].count - 1,
            };
          }
        }
      } else if (isAdding) {
        newWidths.push({ width, count: 1 });
      }

      return newWidths;
    });
  };

  const updateColumnWidth = (
    groupId: number,
    columnId: string,
    width: number | undefined
  ) => {
    setGroups((currentGroups) => {
      const newGroups = [...currentGroups];
      const sourceGroup = newGroups.find((g) => g.id === groupId);
      if (!sourceGroup) return currentGroups;

      const column = sourceGroup.columns.find((col) => col.id === columnId);
      if (!column) return currentGroups;

      const accessorKey = column.accessorKey;

      // Get all synced groups including the source group if it's synced
      const syncedGroups = newGroups.filter(
        (g) => g.synced && (g.id === groupId || sourceGroup.synced)
      );

      // If there are multiple synced groups, apply the width change to matching columns only
      if (syncedGroups.length >= 2) {
        return newGroups.map((g) => {
          if (syncedGroups.some((sg) => sg.id === g.id)) {
            return {
              ...g,
              columns: g.columns.map((col) =>
                // Only update width if the column exists in this group
                col.accessorKey === accessorKey ? { ...col, width } : col
              ),
            };
          }
          return g;
        });
      } else {
        // Update only the specific group
        return newGroups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                columns: g.columns.map((col) =>
                  col.id === columnId ? { ...col, width } : col
                ),
              }
            : g
        );
      }
    });
  };

  const updateColumnOrder = (groupId: number, dragIndex: number, hoverIndex: number) => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        // If this group is not synced, only update if it's the active group
        if (!group.synced && group.id !== groupId) {
          return group;
        }

        // Reorder columns
        const newColumns = [...group.columns];
        const [reorderedColumn] = newColumns.splice(dragIndex, 1);
        newColumns.splice(hoverIndex, 0, reorderedColumn);
        
        return {
          ...group,
          columns: newColumns,
        };
      });
    });
  };

  const getSnapWidth = (
    currentWidth: number,
    threshold: number = 10
  ): number | null => {
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
        <div key={group.id} className="table-group-container">
          <div className="table-group-header">
            <div className="sync-control">
              <input
                type="checkbox"
                checked={group.synced}
                onChange={() => toggleGroupSync(group.id)}
                className="sync-checkbox"
                title="Sync column widths with other groups"
              />
              {group.hasMismatchWarning && (
                <div
                  className="mismatch-warning"
                  title="Some columns in this group don't exist in other synced groups"
                >
                  ⚠️
                </div>
              )}
            </div>
            <input
              type="text"
              value={group.name}
              onChange={(e) => updateGroupName(group.id, e.target.value)}
              className="group-name-input"
              placeholder="Enter group name"
            />
          </div>
          <TableGroup
            key={group.id}
            groupId={group.id}
            onWidthChange={updateSharedWidth}
            getSnapWidth={getSnapWidth}
            columns={group.columns}
            onColumnUpdate={(columnId, width) =>
              updateColumnWidth(group.id, columnId, width)
            }
            onColumnReorder={(dragIndex, hoverIndex) => 
              updateColumnOrder(group.id, dragIndex, hoverIndex)
            }
          />
        </div>
      ))}
    </div>
  );
};
