'use client';

import { memo, useState, useCallback } from 'react';
import {
  FolderOpen,
  FolderClosed,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  Pencil,
  Trash2,
  Loader2,
  Briefcase,
  User,
  GraduationCap,
  DollarSign,
  PenTool,
  Plane,
  Search,
  Code,
  Folder,
  Plus,
} from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Project, Conversation } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ProjectItemProps {
  project: Project;
  conversations: Conversation[];
  isExpanded: boolean;
  activeConversationId: string | null;
  isDeleting: boolean;
  onToggleExpand: (projectId: string) => void;
  onSelectConversation: (id: string) => void;
  onMouseEnterConversation: (id: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, currentName: string) => void;
  onCreateChat: (projectId: string) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  selectedConversations?: Set<string>;
  onToggleSelectConversation?: (id: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  work: Briefcase,
  personal: User,
  school: GraduationCap,
  investments: DollarSign,
  writing: PenTool,
  travel: Plane,
  research: Search,
  coding: Code,
  general: Folder,
};

const truncateTitle = (title: string, maxLength: number = 30): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + '...';
};

export const ProjectItem = memo(function ProjectItem({
  project,
  conversations,
  isExpanded,
  activeConversationId,
  isDeleting,
  onToggleExpand,
  onSelectConversation,
  onMouseEnterConversation,
  onDeleteProject,
  onRenameProject,
  onCreateChat,
  isSelectionMode = false,
  selectedConversations = new Set(),
  onToggleSelectConversation,
}: ProjectItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback(() => {
    onToggleExpand(project.id);
  }, [project.id, onToggleExpand]);

  const handleCreateChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChat(project.id);
  }, [project.id, onCreateChat]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteProject(project.id);
  }, [project.id, onDeleteProject]);

  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRenameProject(project.id, project.name);
  }, [project.id, project.name, onRenameProject]);

  const Icon = categoryIcons[project.category] || Folder;
  const hasActiveConversation = conversations.some((c) => c.id === activeConversationId);

  return (
    <Collapsible open={isExpanded} onOpenChange={handleToggle}>
      <SidebarMenuItem>
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "w-full pr-10 transition-colors",
                hasActiveConversation && "bg-[#00552b]/5"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="size-3 text-[#4c4c4c] flex-shrink-0" />
                ) : (
                  <ChevronRight className="size-3 text-[#4c4c4c] flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen
                    className="size-4 flex-shrink-0"
                    style={{ color: project.color || '#4c4c4c' }}
                  />
                ) : (
                  <FolderClosed
                    className="size-4 flex-shrink-0"
                    style={{ color: project.color || '#4c4c4c' }}
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {project.name}
                </span>
                <span className="text-xs text-[#4c4c4c] ml-auto flex-shrink-0">
                  {conversations.length}
                </span>
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>

          {isHovered && !isSelectionMode && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
                  <DropdownMenuItem onClick={handleRename}>
                    <Pencil className="size-4" />
                    <span>Renombrar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                    <Trash2 className="size-4" />
                    <span>Eliminar proyecto</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </SidebarMenuItem>

      <CollapsibleContent>
        <div
          className="ml-4 border-l-2 pl-2 transition-colors"
          style={{ borderColor: `${project.color}30` || '#e5e7eb' }}
        >
          {/* New Chat Button - elegant minimal */}
          {!isSelectionMode && (
            <button
              onClick={handleCreateChat}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: project.color || '#4c4c4c' }}
            >
              <Plus className="size-3" />
              <span>nuevo</span>
            </button>
          )}

          {conversations.length === 0 && !isSelectionMode ? null : (
            conversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              const isSelected = selectedConversations.has(conversation.id);
              // Check if conversation was created in the last 8 seconds
              const isNew = new Date(conversation.createdAt).getTime() > Date.now() - 8000;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "relative group/item",
                    isNew && "animate-in fade-in slide-in-from-left-2 duration-300"
                  )}
                >
                  {/* Subtle left accent - elegant thin line */}
                  <div
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-300",
                      isActive ? "h-5" : isNew ? "h-4" : "h-3",
                      isNew ? "opacity-100" : isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-40"
                    )}
                    style={{ backgroundColor: project.color || '#4c4c4c' }}
                  />
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (isSelectionMode && onToggleSelectConversation) {
                          onToggleSelectConversation(conversation.id);
                        } else {
                          onSelectConversation(conversation.id);
                        }
                      }}
                      onMouseEnter={() => onMouseEnterConversation(conversation.id)}
                      isActive={!isSelectionMode && isActive}
                      className={cn(
                        "text-sm pl-3 transition-all duration-200",
                        isSelectionMode && isSelected && "bg-[#00552b]/10"
                      )}
                    >
                      {isSelectionMode ? (
                        <div
                          className={cn(
                            "size-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors mr-1",
                            isSelected
                              ? "bg-[#00552b] border-[#00552b]"
                              : "border-[#4c4c4c] bg-transparent"
                          )}
                        >
                          {isSelected && (
                            <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ) : null}
                      <span className="truncate">{truncateTitle(conversation.title)}</span>
                      {isNew && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || '#4c4c4c' }}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              );
            })
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
