# TanStack Table with Advanced Column Management

A React-based table implementation using TanStack Table (React Table) with advanced column management features including draggable columns, resizable columns, and synchronized column widths.

## Features

### 1. Column Management
- **Draggable Columns**: Reorder columns via drag and drop
- **Resizable Columns**: Adjust column widths using a drag handle
- **Width Synchronization**: Option to synchronize widths across columns of the same type
- **Auto Width**: Columns can be set to "Auto" width or specific pixel values
- **Multiple Table Groups**: Support for multiple table instances with synchronized column behavior

### 2. Column Width Management
- **Manual Width Input**: Enter specific pixel values for column widths
- **Drag to Resize**: Interactive resize handle for visual width adjustment
- **Width Synchronization**: Apply width changes to all columns of the same type
- **Persistent Widths**: Column widths are maintained across table groups

## Component Architecture

### TableGroups Component (`TableGroups.tsx`)
The root component that manages multiple table instances and coordinates width synchronization.

**Key Features:**
- Manages shared column width state across tables
- Handles column width updates and synchronization
- Maintains the source of truth for column configurations

**State Management:**
```typescript
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

interface GroupData {
  id: number;
  columns: Column[];
}
```

### TableGroup Component (`TableGroup.tsx`)
Individual table instance that manages its own columns and data.

**Key Features:**
- Handles local column state
- Manages column resizing
- Communicates width changes to parent
- Renders table structure and data

**Width Management:**
```typescript
const setColumnWidth = (columnId: string, width: number | undefined, applyToAll?: boolean) => {
  // Updates column widths locally and notifies parent of changes
  // Handles both single column updates and applying to all columns of same type
}
```

### DraggableColumnHeader Component (`DraggableColumnHeader.tsx`)
Header component that provides drag-and-drop and width adjustment functionality.

**Key Features:**
- Drag handle for column reordering
- Width adjustment popover
- Width synchronization checkbox
- Manual width input

**User Interface:**
- Click header to open width adjustment popover
- Drag edges to resize
- Checkbox to apply width to all similar columns
- Input field for manual width entry

## Implementation Details

### Width Synchronization
1. **Local Width Changes:**
   - Each column maintains its own width state
   - Changes are first applied locally
   - Parent is notified of changes

2. **Global Width Synchronization:**
   - Parent component tracks shared widths
   - Width changes can be applied to all columns of same type
   - Synchronization is optional per column

3. **Width Application Process:**
   ```typescript
   // 1. User initiates width change
   // 2. Local column updates its width
   // 3. If "Apply to all" is checked:
   //    - Find all columns with same accessorKey
   //    - Update their widths
   //    - Notify parent of changes
   // 4. If "Apply to all" is unchecked:
   //    - Only update current column
   //    - Notify parent of single column change
   ```

## Limitations and Considerations

### Current Limitations

1. **Performance:**
   - Large number of columns with synchronized widths may impact performance
   - No virtualization for horizontal scrolling
   - All width calculations happen synchronously

2. **Width Calculations:**
   - Minimum width is not enforced
   - No maximum width constraints
   - No consideration for content-based width optimization

3. **State Management:**
   - No persistence between page reloads
   - Width synchronization state is not saved
   - No undo/redo functionality for width changes

4. **User Interface:**
   - No visual feedback during width synchronization
   - Limited keyboard accessibility
   - No touch optimization for mobile devices

5. **Column Types:**
   - No special handling for different content types
   - No automatic width suggestions based on content
   - No column-specific width constraints

### Future Improvements

1. **Performance Optimizations:**
   - Implement width change batching
   - Add horizontal virtualization
   - Optimize width synchronization for large tables

2. **Enhanced Width Management:**
   - Add min/max width constraints
   - Implement content-aware width suggestions
   - Add width presets for common column types

3. **State Management:**
   - Add local storage persistence
   - Implement undo/redo functionality
   - Add width synchronization presets

4. **User Experience:**
   - Add visual feedback for width changes
   - Improve keyboard accessibility
   - Add touch-friendly controls
   - Add width animation transitions

5. **Column Features:**
   - Add column-specific width rules
   - Implement content-type-specific behavior
   - Add column grouping with shared width controls

## Usage

```tsx
// Example usage of TableGroups
<TableGroups />

// Individual table group
<TableGroup
  groupId={1}
  onWidthChange={(width, isAdding) => {}}
  getSnapWidth={(currentWidth, threshold) => null}
  columns={columns}
  onColumnUpdate={(columnId, width, applyToAll) => {}}
/>
```

## Development and Contributing

1. **Setup:**
   ```bash
   npm install
   npm start
   ```

2. **Testing Changes:**
   - Test width synchronization with multiple table groups
   - Verify drag and drop functionality
   - Check width input validation
   - Test responsive behavior

3. **Contributing Guidelines:**
   - Maintain TypeScript types
   - Add comments for complex logic
   - Update documentation for new features
   - Add unit tests for new functionality
