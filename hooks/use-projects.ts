import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type Project, type ProjectWithConversations, type Conversation } from '@/lib/api-client';
import { conversationKeys } from './use-conversations';

export type { Project, ProjectWithConversations };

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  unorganized: () => [...projectKeys.all, 'unorganized'] as const,
};

// Fetch all projects
async function fetchProjects(): Promise<Project[]> {
  const data = await projectsApi.list();
  return data.projects;
}

// Fetch project with conversations
async function fetchProject(id: string): Promise<ProjectWithConversations> {
  const data = await projectsApi.get(id);
  return data.project;
}

// Fetch unorganized conversations
async function fetchUnorganizedConversations(): Promise<Conversation[]> {
  const data = await projectsApi.getUnorganized();
  return data.conversations;
}

// Create project
async function createProject(params: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: Project['category'];
  customInstructions?: string;
}) {
  const data = await projectsApi.create(params);
  return data.project;
}

// Update project
async function updateProject({ id, ...params }: {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: Project['category'];
  customInstructions?: string;
}) {
  const data = await projectsApi.update(id, params);
  return data.project;
}

// Delete project
async function deleteProject(id: string) {
  await projectsApi.delete(id);
  return { id };
}

// Delete project with all conversations
async function deleteProjectWithConversations(id: string) {
  const result = await projectsApi.deleteWithConversations(id);
  return { id, deletedConversations: result.deletedConversations };
}

// Add conversation to project
async function addConversationToProject({ projectId, conversationId }: {
  projectId: string;
  conversationId: string;
}) {
  await projectsApi.addConversation(projectId, conversationId);
  return { projectId, conversationId };
}

// Remove conversation from project
async function removeConversationFromProject({ projectId, conversationId }: {
  projectId: string;
  conversationId: string;
}) {
  await projectsApi.removeConversation(projectId, conversationId);
  return { projectId, conversationId };
}

// Hook: Get all projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook: Get a specific project with conversations
export function useProject(id: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => fetchProject(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook: Get unorganized conversations
export function useUnorganizedConversations() {
  return useQuery({
    queryKey: projectKeys.unorganized(),
    queryFn: fetchUnorganizedConversations,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook: Create project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.lists(),
        (old) => {
          if (!old) return [newProject];
          return [newProject, ...old];
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Hook: Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.lists(),
        (old) => old?.map((p) => (p.id === updatedProject.id ? updatedProject : p)) ?? []
      );
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updatedProject.id) });
    },
  });
}

// Hook: Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      queryClient.setQueryData<Project[]>(
        projectKeys.lists(),
        (old) => old?.filter((p) => p.id !== deletedId) ?? []
      );

      return { previousProjects };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.lists(),
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Also invalidate conversations since they might have been updated
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Hook: Delete project with all conversations
export function useDeleteProjectWithConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectWithConversations,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });
      await queryClient.cancelQueries({ queryKey: conversationKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      queryClient.setQueryData<Project[]>(
        projectKeys.lists(),
        (old) => old?.filter((p) => p.id !== deletedId) ?? []
      );

      return { previousProjects };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.lists(),
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Hook: Add conversation to project
export function useAddConversationToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addConversationToProject,
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.unorganized() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Hook: Remove conversation from project
export function useRemoveConversationFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeConversationFromProject,
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.unorganized() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
