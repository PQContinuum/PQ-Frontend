'use client';

import React, { useCallback, memo, useState, useMemo } from 'react';
import { Loader2, CheckSquare, X, Trash2, FolderPlus, MessageSquare } from 'lucide-react';
import { useConversationId, useSetConversationId, useReplaceMessages, useSetGeoCulturalMode, useSetUserLocation, useSetPendingProjectId } from '../store';
import type { ChatMessage, MessageGenerationState } from '../store';
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { ConversationItem } from './ConversationItem';
import { ProjectItem } from './ProjectItem';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useConversations,
  useDeleteConversation,
  useDeleteConversations,
  usePrefetchConversation,
  conversationKeys,
} from '@/hooks/use-conversations';
import {
  useProjects,
  useDeleteProject,
  useDeleteProjectWithConversations,
  useUpdateProject,
} from '@/hooks/use-projects';
import type { ConversationWithMessages } from '@/hooks/use-conversations';
import { useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api-client';
import type { WebSearchResult } from '@/types/websearch';
import { extractFirstUrl, getLinkTypeFromUrl } from '@/lib/link-resolver';

// Helper para transformar mensajes de API a ChatMessage con generationState
function mapApiMessagesToChatMessages(
  messages: ConversationWithMessages['messages']
): ChatMessage[] {
  let pendingLinkInfo: ChatMessage['linkInfo'] | null = null;

  return messages.map((msg) => {
    let generationState: MessageGenerationState | undefined = undefined;
    let citations: WebSearchResult[] | undefined = undefined;
    let webSearchError: string | null | undefined = undefined;
    let linkInfo: ChatMessage['linkInfo'] | undefined = undefined;

    // Parsear metadata si existe
    if (msg.metadata) {
      try {
        const metadata = typeof msg.metadata === 'string'
          ? JSON.parse(msg.metadata)
          : msg.metadata;
        if (metadata?.generationState) {
          generationState = metadata.generationState as MessageGenerationState;
          console.log('[ConversationHistory] Parsed generationState:', generationState, 'for message:', msg.id, 'content:', msg.content?.substring(0, 30));
        }
        if (Array.isArray(metadata?.citations)) {
          citations = metadata.citations as WebSearchResult[];
        }
        if (typeof metadata?.webSearchError === 'string') {
          webSearchError = metadata.webSearchError;
        }
        if (metadata?.linkInfo && typeof metadata.linkInfo?.url === 'string' && typeof metadata.linkInfo?.type === 'string') {
          linkInfo = {
            url: metadata.linkInfo.url,
            type: metadata.linkInfo.type,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (msg.role === 'user') {
      const detectedUrl = extractFirstUrl(msg.content);
      pendingLinkInfo = detectedUrl
        ? { url: detectedUrl, type: getLinkTypeFromUrl(detectedUrl) }
        : null;
    } else if (msg.role === 'assistant') {
      if (!linkInfo && pendingLinkInfo) {
        linkInfo = pendingLinkInfo;
      }
      if (pendingLinkInfo) {
        pendingLinkInfo = null;
      }
    } else {
      pendingLinkInfo = null;
    }

    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments,
      generationState,
      citations,
      webSearchError: webSearchError ?? null,
      linkInfo,
    };
  });
}

export const ConversationHistory = memo(function ConversationHistory() {
  const conversationId = useConversationId();
  const setConversationId = useSetConversationId();
  const replaceMessages = useReplaceMessages();
  const setGeoCulturalMode = useSetGeoCulturalMode();
  const setUserLocation = useSetUserLocation();
  const setPendingProjectId = useSetPendingProjectId();

  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading: isLoadingConversations, isError: isErrorConversations } = useConversations();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const deleteMutation = useDeleteConversation();
  const bulkDeleteMutation = useDeleteConversations();
  const deleteProjectMutation = useDeleteProject();
  const deleteProjectWithConvMutation = useDeleteProjectWithConversations();
  const updateProjectMutation = useUpdateProject();
  const prefetchConversation = usePrefetchConversation();

  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = React.useState(false);
  const [deleteProjectWithConversations, setDeleteProjectWithConversations] = React.useState(false);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Project state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  // Group conversations by project
  const { projectConversations, unorganizedConversations } = useMemo(() => {
    const byProject: Record<string, typeof conversations> = {};
    const unorganized: typeof conversations = [];

    conversations.forEach((conv) => {
      if (conv.projectId) {
        if (!byProject[conv.projectId]) {
          byProject[conv.projectId] = [];
        }
        byProject[conv.projectId].push(conv);
      } else {
        unorganized.push(conv);
      }
    });

    return {
      projectConversations: byProject,
      unorganizedConversations: unorganized,
    };
  }, [conversations]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setConversationId(id);

    const cachedConversation = queryClient.getQueryData<ConversationWithMessages>(
      conversationKeys.detail(id)
    );

    if (cachedConversation) {
      replaceMessages(mapApiMessagesToChatMessages(cachedConversation.messages));

      if (cachedConversation.geoCulturalContext) {
        try {
          const geoCulturalData = JSON.parse(cachedConversation.geoCulturalContext);
          setGeoCulturalMode(true);
          setUserLocation(geoCulturalData);
        } catch (error) {
          console.error('[GeoCultural] Error parsing cached geocultural context:', error);
        }
      } else {
        setGeoCulturalMode(false);
        setUserLocation(null);
      }

      queryClient.fetchQuery<ConversationWithMessages>({
        queryKey: conversationKeys.detail(id),
        queryFn: async () => {
          const data = await conversationsApi.get(id);
          return data.conversation as ConversationWithMessages;
        },
        staleTime: 1000 * 60 * 10,
      }).then((freshConversation) => {
        if (JSON.stringify(freshConversation.messages) !== JSON.stringify(cachedConversation.messages)) {
          replaceMessages(mapApiMessagesToChatMessages(freshConversation.messages));
        }

        if (freshConversation.geoCulturalContext !== cachedConversation.geoCulturalContext) {
          if (freshConversation.geoCulturalContext) {
            try {
              const geoCulturalData = JSON.parse(freshConversation.geoCulturalContext);
              setGeoCulturalMode(true);
              setUserLocation(geoCulturalData);
            } catch (error) {
              console.error('[GeoCultural] Error parsing fresh geocultural context:', error);
            }
          } else {
            setGeoCulturalMode(false);
            setUserLocation(null);
          }
        }
      }).catch((error) => {
        console.error('Background revalidation error:', error);
      });
    } else {
      try {
        const conversation = await queryClient.fetchQuery<ConversationWithMessages>({
          queryKey: conversationKeys.detail(id),
          queryFn: async () => {
            const data = await conversationsApi.get(id);
            return data.conversation as ConversationWithMessages;
          },
          staleTime: 1000 * 60 * 10,
        });

        replaceMessages(mapApiMessagesToChatMessages(conversation.messages));

        if (conversation.geoCulturalContext) {
          try {
            const geoCulturalData = JSON.parse(conversation.geoCulturalContext);
            setGeoCulturalMode(true);
            setUserLocation(geoCulturalData);
          } catch (error) {
            console.error('[GeoCultural] Error parsing geocultural context:', error);
          }
        } else {
          setGeoCulturalMode(false);
          setUserLocation(null);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        setConversationId(null);
      }
    }
  }, [setConversationId, replaceMessages, setGeoCulturalMode, setUserLocation, queryClient]);

  const handleMouseEnter = useCallback((id: string) => {
    prefetchConversation(id);
  }, [prefetchConversation]);

  const handleDeleteConversation = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!conversationToDelete) return;

    try {
      await deleteMutation.mutateAsync(conversationToDelete);

      if (conversationId === conversationToDelete) {
        setConversationId(null);
        replaceMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, conversationId, deleteMutation, setConversationId, replaceMessages]);

  const handleStartRename = useCallback((id: string, currentTitle: string) => {
    setRenamingId(id);
    setNewTitle(currentTitle);
  }, []);

  const handleRenameConversation = useCallback(async (id: string) => {
    if (!newTitle.trim()) {
      setRenamingId(null);
      return;
    }

    try {
      await conversationsApi.update(id, { title: newTitle.trim() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      setRenamingId(null);
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [newTitle, queryClient]);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
    setNewTitle('');
  }, []);

  // Selection mode handlers
  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedConversations(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedConversations.size === 0) return;
    setBulkDeleteDialogOpen(true);
  }, [selectedConversations.size]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedConversations.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedConversations);
      await bulkDeleteMutation.mutateAsync(idsToDelete);

      if (conversationId && selectedConversations.has(conversationId)) {
        setConversationId(null);
        replaceMessages([]);
      }

      setIsSelectionMode(false);
      setSelectedConversations(new Set());
    } catch (error) {
      console.error('Error bulk deleting conversations:', error);
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  }, [selectedConversations, conversationId, bulkDeleteMutation, setConversationId, replaceMessages]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedConversations(new Set());
  }, []);

  // Project handlers
  const handleToggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteProjectWithConversations(false); // Reset checkbox
    setDeleteProjectDialogOpen(true);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      if (deleteProjectWithConversations) {
        // Delete project AND all conversations
        await deleteProjectWithConvMutation.mutateAsync(projectToDelete);

        // If active conversation was in this project, clear it
        const projectConvs = projectConversations[projectToDelete] || [];
        if (projectConvs.some(c => c.id === conversationId)) {
          setConversationId(null);
          replaceMessages([]);
        }
      } else {
        // Only unlink conversations (existing behavior)
        await deleteProjectMutation.mutateAsync(projectToDelete);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleteProjectDialogOpen(false);
      setProjectToDelete(null);
      setDeleteProjectWithConversations(false);
    }
  }, [projectToDelete, deleteProjectMutation, deleteProjectWithConvMutation, deleteProjectWithConversations, projectConversations, conversationId, setConversationId, replaceMessages]);

  const handleRenameProject = useCallback((projectId: string, currentName: string) => {
    setRenamingProjectId(projectId);
    setNewProjectName(currentName);
  }, []);

  const handleSaveProjectName = useCallback(async (projectId: string) => {
    if (!newProjectName.trim()) {
      setRenamingProjectId(null);
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        name: newProjectName.trim(),
      });
      setRenamingProjectId(null);
    } catch (error) {
      console.error('Error renaming project:', error);
    }
  }, [newProjectName, updateProjectMutation]);

  const handleCreateChatInProject = useCallback((projectId: string) => {
    // Clear current conversation and set pending project
    setConversationId(null);
    replaceMessages([]);
    setPendingProjectId(projectId);
    setGeoCulturalMode(false);
    setUserLocation(null);

    // Expand the project if not already
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });
  }, [setConversationId, replaceMessages, setPendingProjectId, setGeoCulturalMode, setUserLocation]);

  const isLoading = isLoadingConversations || isLoadingProjects;

  if (isLoading) {
    return (
      <SidebarMenuItem>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-[#FF8B3D]" />
        </div>
      </SidebarMenuItem>
    );
  }

  if (isErrorConversations) {
    return (
      <SidebarMenuItem>
        <div className="px-4 py-8 text-center text-sm text-red-600">
          Error al cargar conversaciones
        </div>
      </SidebarMenuItem>
    );
  }

  const hasContent = conversations.length > 0 || projects.length > 0;

  if (!hasContent) {
    return state === 'expanded' ? (
      <>
        {/* Create Project Button */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => setCreateProjectOpen(true)}
            className="text-[#4c4c4c] hover:text-[#FF8B3D] hover:bg-[#FF8B3D]/5"
          >
            <FolderPlus className="size-4" />
            <span>Crear proyecto</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <div className="px-4 py-8 text-center text-sm text-[#4c4c4c]">
            No hay conversaciones recientes
          </div>
        </SidebarMenuItem>

        <ProjectCreateDialog
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
        />
      </>
    ) : null;
  }

  return (
    <>
      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conversaciones</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {selectedConversations.size} conversación{selectedConversations.size !== 1 ? 'es' : ''}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                `Eliminar ${selectedConversations.size}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              {projectToDelete && (projectConversations[projectToDelete]?.length || 0) > 0
                ? `Este proyecto tiene ${projectConversations[projectToDelete]?.length} conversación(es).`
                : 'Este proyecto no tiene conversaciones.'}
            </DialogDescription>
          </DialogHeader>

          {/* Checkbox to delete conversations */}
          {projectToDelete && (projectConversations[projectToDelete]?.length || 0) > 0 && (
            <label className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
              <input
                type="checkbox"
                checked={deleteProjectWithConversations}
                onChange={(e) => setDeleteProjectWithConversations(e.target.checked)}
                className="mt-0.5 size-4 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Eliminar todas las conversaciones
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Se eliminarán permanentemente {projectConversations[projectToDelete]?.length} conversación(es) con todos sus mensajes y archivos adjuntos.
                </p>
              </div>
            </label>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProject}
              disabled={deleteProjectMutation.isPending || deleteProjectWithConvMutation.isPending}
            >
              {(deleteProjectMutation.isPending || deleteProjectWithConvMutation.isPending) ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : deleteProjectWithConversations ? (
                'Eliminar todo'
              ) : (
                'Eliminar proyecto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectCreateDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />

      {state === 'expanded' && (
        <>
          {/* Create Project Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCreateProjectOpen(true)}
              className="text-[#4c4c4c] hover:text-[#FF8B3D] hover:bg-[#FF8B3D]/5"
            >
              <FolderPlus className="size-4" />
              <span>Crear proyecto</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Selection mode header */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
            {isSelectionMode ? (
              <>
                <button
                  onClick={handleCancelSelectionMode}
                  className="flex items-center gap-1.5 text-sm text-[#4c4c4c] hover:text-[#FF8B3D] transition-colors"
                >
                  <X className="size-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleBulkDeleteClick}
                  disabled={selectedConversations.size === 0}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-4" />
                  <span>Eliminar ({selectedConversations.size})</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleToggleSelectionMode}
                className="flex items-center gap-1.5 text-sm text-[#4c4c4c] hover:text-[#FF8B3D] transition-colors ml-auto"
              >
                <CheckSquare className="size-4" />
                <span>Seleccionar</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Projects */}
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          conversations={projectConversations[project.id] || []}
          isExpanded={expandedProjects.has(project.id)}
          activeConversationId={conversationId}
          isDeleting={deleteProjectMutation.isPending && deleteProjectMutation.variables === project.id}
          onToggleExpand={handleToggleProjectExpand}
          onSelectConversation={handleSelectConversation}
          onMouseEnterConversation={handleMouseEnter}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onCreateChat={handleCreateChatInProject}
          isSelectionMode={isSelectionMode}
          selectedConversations={selectedConversations}
          onToggleSelectConversation={handleToggleSelect}
        />
      ))}

      {/* Unorganized Conversations (Reciente) */}
      {unorganizedConversations.length > 0 && (
        <>
          {projects.length > 0 && (
            <div className="px-2 py-2 text-xs font-medium text-[#4c4c4c] flex items-center gap-2">
              <MessageSquare className="size-3" />
              <span>Reciente</span>
            </div>
          )}
          {unorganizedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversationId === conversation.id}
              isRenaming={renamingId === conversation.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === conversation.id}
              newTitle={newTitle}
              onSelect={handleSelectConversation}
              onMouseEnter={handleMouseEnter}
              onDelete={handleDeleteConversation}
              onStartRename={handleStartRename}
              onRename={handleRenameConversation}
              onCancelRename={handleCancelRename}
              onTitleChange={setNewTitle}
              isSelectionMode={isSelectionMode}
              isSelected={selectedConversations.has(conversation.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </>
      )}
    </>
  );
});
