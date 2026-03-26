'use client';

import { useState } from 'react';
import { Trash2, Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteCharacter } from '@/hooks/use-characters';
import type { Character } from '@/lib/lisa/types';

interface DeleteCharacterModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteCharacterModal({
  character,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCharacterModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const deleteMutation = useDeleteCharacter();

  const canDelete = confirmName.toLowerCase() === character.name.toLowerCase();

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      await deleteMutation.mutateAsync(character.id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="!max-w-sm p-0 gap-0 overflow-hidden">
        <div className="p-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-[#111]">
              Eliminar personaje
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#888]">
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          {/* Character preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-black/[0.06]">
            {character.referenceImageUrl ? (
              <img
                src={character.referenceImageUrl}
                alt={character.name}
                className="size-11 rounded-lg object-cover border border-black/[0.06]"
              />
            ) : (
              <div className="size-11 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Users className="size-5 text-[#bbb]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#111] truncate">{character.name}</p>
              <p className="text-[12px] text-[#999]">
                {character.isPublic ? 'Público' : 'Privado'} · {character.visualStyle || 'Sin estilo'}
              </p>
            </div>
          </div>

          {/* Warning */}
          <ul className="space-y-1.5 text-[12px] text-[#888]">
            <li className="flex items-start gap-2">
              <span className="mt-1 block size-1 rounded-full bg-[#bbb] shrink-0" />
              Se eliminará permanentemente de tu cuenta
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block size-1 rounded-full bg-[#bbb] shrink-0" />
              No podrás recuperarlo después
            </li>
            {character.isPublic && (
              <li className="flex items-start gap-2">
                <span className="mt-1 block size-1 rounded-full bg-[#bbb] shrink-0" />
                Desaparecerá de la galería pública
              </li>
            )}
          </ul>

          {/* Confirmation input */}
          <div>
            <label className="block text-[12px] font-medium text-[#666] mb-1.5">
              Escribe <span className="font-semibold text-[#111]">{character.name}</span> para confirmar
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Nombre del personaje"
              className="w-full px-3 py-2 text-[13px] border border-black/[0.08] rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-400/20 focus:outline-none transition-colors placeholder:text-[#ccc]"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={deleteMutation.isPending}
              className="flex-1 h-9 text-[13px] font-medium border-black/[0.08] text-[#666] hover:bg-neutral-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || deleteMutation.isPending}
              className="flex-1 h-9 text-[13px] font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-40"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5 mr-1.5" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
