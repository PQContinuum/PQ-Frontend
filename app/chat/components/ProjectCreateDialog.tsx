'use client';

import { useState, useCallback } from 'react';
import { Loader2, FolderPlus, Briefcase, User, GraduationCap, DollarSign, PenTool, Plane, Search, Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateProject } from '@/hooks/use-projects';
import type { Project } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: Project) => void;
}

const categories = [
  { id: 'work', label: 'Trabajo', icon: Briefcase, color: '#3B82F6' },
  { id: 'personal', label: 'Personal', icon: User, color: '#10B981' },
  { id: 'school', label: 'Tareas escolares', icon: GraduationCap, color: '#8B5CF6' },
  { id: 'investments', label: 'Inversiones', icon: DollarSign, color: '#F59E0B' },
  { id: 'writing', label: 'Escritura', icon: PenTool, color: '#EC4899' },
  { id: 'travel', label: 'Viajes', icon: Plane, color: '#06B6D4' },
  { id: 'research', label: 'Investigación', icon: Search, color: '#6366F1' },
  { id: 'coding', label: 'Programación', icon: Code, color: '#84CC16' },
] as const;

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProjectCreateDialogProps) {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const createProject = useCreateProject();

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;

    const category = categories.find((c) => c.id === selectedCategory);

    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        category: (selectedCategory || 'general') as Project['category'],
        color: category?.color,
        icon: category?.id,
      });

      onSuccess?.(project);
      onOpenChange(false);
      setName('');
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }, [name, selectedCategory, createProject, onSuccess, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setName('');
    setSelectedCategory(null);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-5" />
            Crear proyecto
          </DialogTitle>
          <DialogDescription>
            Los proyectos guardan chats, archivos e instrucciones personalizadas en un solo lugar. Úsalos para el trabajo en curso o para mantener todo organizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Nombre del proyecto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Categoría (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm transition-all bg-white"
                    style={{
                      borderColor: isSelected ? category.color : '#e5e7eb',
                      color: isSelected ? category.color : '#374151',
                    }}
                  >
                    <Icon className="size-4" style={{ color: category.color }} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createProject.isPending}
            className="bg-[#00552b] hover:bg-[#00552b]/90"
          >
            {createProject.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              'Crear proyecto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
