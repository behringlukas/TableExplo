import type React from "react"
import { useState } from "react"
import { TableGroup } from "./TableGroup"
import "./TableGroups.css"

interface ColumnWidth {
  width: number
  count: number
}

export const TableGroups: React.FC = () => {
  const [groups, setGroups] = useState([{ id: 1 }])
  // Track column widths across all groups
  const [columnWidths, setColumnWidths] = useState<ColumnWidth[]>([])

  const addGroup = () => {
    setGroups([...groups, { id: Date.now() }])
  }

  const updateSharedWidth = (width: number, isAdding: boolean) => {
    setColumnWidths(prev => {
      const existingIndex = prev.findIndex(w => Math.abs(w.width - width) < 5)
      const newWidths = [...prev]

      if (existingIndex >= 0) {
        if (isAdding) {
          newWidths[existingIndex] = {
            width: ((newWidths[existingIndex].width * newWidths[existingIndex].count) + width) / (newWidths[existingIndex].count + 1),
            count: newWidths[existingIndex].count + 1
          }
        } else {
          if (newWidths[existingIndex].count <= 1) {
            newWidths.splice(existingIndex, 1)
          } else {
            newWidths[existingIndex] = {
              width: ((newWidths[existingIndex].width * newWidths[existingIndex].count) - width) / (newWidths[existingIndex].count - 1),
              count: newWidths[existingIndex].count - 1
            }
          }
        }
      } else if (isAdding) {
        newWidths.push({ width, count: 1 })
      }

      return newWidths
    })
  }

  const getSnapWidth = (currentWidth: number, threshold: number = 10): number | null => {
    if (columnWidths.length === 0) return null

    const closestWidth = columnWidths.reduce((closest, current) => {
      const diff = Math.abs(currentWidth - current.width)
      return diff < threshold && diff < Math.abs(currentWidth - closest.width) ? current : closest
    }, columnWidths[0])

    return Math.abs(currentWidth - closestWidth.width) < threshold ? closestWidth.width : null
  }

  return (
    <div className="table-groups">
      <button onClick={addGroup} className="add-group-button">
        Add New Group
      </button>
      {groups.map((group) => (
        <TableGroup 
          key={group.id} 
          groupId={group.id} 
          onWidthChange={updateSharedWidth}
          getSnapWidth={getSnapWidth}
        />
      ))}
    </div>
  )
}
