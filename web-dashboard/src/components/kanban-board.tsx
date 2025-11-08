'use client';

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

export interface KanbanColumn<T = unknown> {
  id: string;
  title: string;
  items: T[];
}

export interface KanbanItem {
  id: string;
  [key: string]: unknown;
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn<T>[];
  renderItem: (item: T) => React.ReactNode;
  onDragEnd: (itemId: string, fromColumn: string, toColumn: string) => void;
  className?: string;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderItem,
  onDragEnd,
  className,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeItem, setActiveItem] = React.useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the active item
    for (const column of columns) {
      const item = column.items.find((item) => item.id === active.id);
      if (item) {
        setActiveItem(item);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination columns
    let fromColumn: string | null = null;
    let toColumn: string | null = null;

    // Check if dropped on a column
    const destinationColumn = columns.find((col) => col.id === overId);
    if (destinationColumn) {
      toColumn = destinationColumn.id;
    }

    // Check if dropped on an item
    for (const column of columns) {
      if (column.items.find((item) => item.id === activeId)) {
        fromColumn = column.id;
      }
      if (column.items.find((item) => item.id === overId)) {
        toColumn = column.id;
      }
    }

    if (fromColumn && toColumn && fromColumn !== toColumn) {
      onDragEnd(activeId, fromColumn, toColumn);
    }

    setActiveId(null);
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'flex gap-4 overflow-x-auto pb-4',
          className
        )}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex min-w-[300px] flex-1 flex-col rounded-lg border bg-muted/30"
          >
            {/* Column Header */}
            <div className="border-b bg-muted/50 p-4">
              <h3 className="font-semibold">
                {column.title}{' '}
                <span className="text-sm text-muted-foreground">
                  ({column.items.length})
                </span>
              </h3>
            </div>

            {/* Column Items */}
            <SortableContext
              id={column.id}
              items={column.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex-1 space-y-2 p-4">
                {column.items.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                    Drop items here
                  </div>
                ) : (
                  column.items.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                      {renderItem(item)}
                    </SortableItem>
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 opacity-80">{renderItem(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
