'use client';

import { memo, useCallback } from 'react';
import { MessageSquare, Ellipsis, Loader2, Pencil, Trash2 } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Conversation } from '@/db/schema';

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
}

const truncateTitle = (title: string, maxLength: number = 35): string => {
  if (title.length <= maxLength) return title.trim() + '...';
  return title.substring(0, maxLength).trim() + '...';
};

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
}: ConversationItemProps) {
  const handleSelect = useCallback(() => {
    onSelect(conversation.id);
  }, [conversation.id, onSelect]);

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
              className="flex-1 text-sm font-medium bg-white border border-[#00552b] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00552b]/20"
            />
          </div>
        ) : (
          <>
            <SidebarMenuButton
              onClick={handleSelect}
              isActive={isActive}
              className="data-[active=true]:bg-[#00552b]/10 data-[active=true]:text-[#00552b] hover:bg-[#00552b]/5 transition-colors pr-10"
            >
              <MessageSquare className="size-4 flex-shrink-0" />
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {truncateTitle(conversation.title)}
                </div>
              </div>
            </SidebarMenuButton>

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
          </>
        )}
      </div>
    </SidebarMenuItem>
  );
});
