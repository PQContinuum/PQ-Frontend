'use client';

import { memo, useCallback } from 'react';
import { MessageSquare, Ellipsis, Loader2, Pencil, Trash2, Check } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Conversation } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  newTitle: string;
  onSelect: (id: string) => void;
  onMouseEnter: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onStartRename: (id: string, title: string) => void;
  onRename: (id: string) => void;
  onCancelRename: () => void;
  onTitleChange: (title: string) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const truncateTitle = (title: string, maxLength: number = 30): string => {
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength).trim() + '...';
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}mes`;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  isRenaming,
  isDeleting,
  newTitle,
  onSelect,
  onMouseEnter,
  onDelete,
  onStartRename,
  onRename,
  onCancelRename,
  onTitleChange,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: ConversationItemProps) {
  const handleSelect = useCallback(() => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(conversation.id);
    } else {
      onSelect(conversation.id);
    }
  }, [conversation.id, isSelectionMode, onToggleSelect, onSelect]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(conversation.id);
  }, [conversation.id, onMouseEnter]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    onDelete(e, conversation.id);
  }, [conversation.id, onDelete]);

  const handleStartRename = useCallback(() => {
    onStartRename(conversation.id, conversation.title);
  }, [conversation.id, conversation.title, onStartRename]);

  const handleRename = useCallback(() => {
    onRename(conversation.id);
  }, [conversation.id, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  }, [handleRename, onCancelRename]);

  return (
    <SidebarMenuItem>
      <div
        className="relative group"
        onMouseEnter={handleMouseEnter}
      >
        {isRenaming ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <MessageSquare className="size-4 flex-shrink-0 text-[#4c4c4c]" />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              autoFocus
              className="flex-1 text-sm font-medium bg-white border border-[#FF8B3D] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FF8B3D]/20"
            />
          </div>
        ) : (
          <>
            <SidebarMenuButton
              onClick={handleSelect}
              isActive={!isSelectionMode && isActive}
              className={cn(
                "data-[active=true]:bg-[#FF8B3D]/10 data-[active=true]:text-[#FF8B3D] hover:bg-[#FF8B3D]/5 transition-colors",
                isSelectionMode ? "pr-4" : "pr-10",
                isSelectionMode && isSelected && "bg-[#FF8B3D]/10"
              )}
            >
              {isSelectionMode ? (
                <div
                  className={cn(
                    "size-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-[#FF8B3D] border-[#FF8B3D]"
                      : "border-[#4c4c4c] bg-transparent"
                  )}
                >
                  {isSelected && <Check className="size-3 text-white" />}
                </div>
              ) : (
                <div className={cn(
                  "size-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                  isActive ? "bg-[#FF8B3D]/15" : "bg-black/[0.04]"
                )}>
                  <MessageSquare className={cn(
                    "size-3.5",
                    isActive ? "text-[#FF8B3D]" : "text-[#999]"
                  )} />
                </div>
              )}
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {truncateTitle(conversation.title)}
                </div>
              </div>
              {!isSelectionMode && (
                <span className="text-[10px] text-[#bbb] flex-shrink-0 group-hover:hidden">
                  {getRelativeTime(conversation.updatedAt)}
                </span>
              )}
            </SidebarMenuButton>

            {!isSelectionMode && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-black/5 transition-colors"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin text-[#4c4c4c]" />
                      ) : (
                        <Ellipsis className="size-4 text-[#4c4c4c]" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-48">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename();
                      }}
                    >
                      <Pencil className="size-4" />
                      <span>Renombrar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="size-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarMenuItem>
  );
});
