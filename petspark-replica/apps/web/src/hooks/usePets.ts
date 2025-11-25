import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient, endpoints } from '@/lib/api'
import type { Pet, CreatePetData, UpdatePetData } from '@shared/types'

export function usePets() {
  const queryClient = useQueryClient()

  // Get user's pets
  const {
    data: pets = [],
    isLoading,
    error,
  } = useQuery<Pet[]>({
    queryKey: ['pets'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.pets.list)
      return response.data as Pet[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false, // Optimize performance
  })

  // Create pet mutation
  const createPetMutation = useMutation({
    mutationFn: async (data: CreatePetData) => {
      const response = await apiClient.post(endpoints.pets.create, data)
      return response.data as Pet
    },
    onSuccess: newPet => {
      queryClient.setQueryData(['pets'], (old: Pet[] | undefined) =>
        old ? [...old, newPet] : [newPet]
      )
    },
  })

  // Update pet mutation
  const updatePetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePetData }) => {
      const response = await apiClient.put(`${endpoints.pets.update}/${id}`, data)
      return response.data as Pet
    },
    onSuccess: updatedPet => {
      queryClient.setQueryData(['pets'], (old: Pet[] | undefined) =>
        old?.map(pet => (pet.id === updatedPet.id ? updatedPet : pet))
      )
      // Also update individual pet cache if it exists
      queryClient.setQueryData(['pet', updatedPet.id], updatedPet)
    },
  })

  // Delete pet mutation
  const deletePetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${endpoints.pets.delete}/${id}`)
      return id
    },
    onSuccess: deletedId => {
      queryClient.setQueryData(['pets'], (old: Pet[] | undefined) =>
        old?.filter(pet => pet.id !== deletedId)
      )
      // Also remove individual pet cache if it exists
      queryClient.removeQueries({ queryKey: ['pet', deletedId] })
    },
  })

  // Upload pet image mutation
  const uploadPetImageMutation = useMutation({
    mutationFn: async ({ petId, file }: { petId: string; file: File }) => {
      const response = await apiClient.upload(endpoints.pets.uploadImage, file, { petId })
      return response.data as { imageUrl: string }
    },
    onSuccess: (data, variables) => {
      const { imageUrl } = data
      queryClient.setQueryData(['pets'], (old: Pet[] | undefined) =>
        old?.map(pet =>
          pet.id === variables.petId ? { ...pet, images: [...pet.images, imageUrl] } : pet
        )
      )
    },
  })

  return {
    pets,
    isLoading,
    error,
    createPet: useCallback(
      (data: CreatePetData) => createPetMutation.mutateAsync(data),
      [createPetMutation]
    ),
    updatePet: useCallback(
      ({ id, data }: { id: string; data: UpdatePetData }) =>
        updatePetMutation.mutateAsync({ id, data }),
      [updatePetMutation]
    ),
    deletePet: useCallback((id: string) => deletePetMutation.mutateAsync(id), [deletePetMutation]),
    uploadPetImage: useCallback(
      ({ petId, file }: { petId: string; file: File }) =>
        uploadPetImageMutation.mutateAsync({ petId, file }),
      [uploadPetImageMutation]
    ),
    isCreatingPet: createPetMutation.isPending,
    isUpdatingPet: updatePetMutation.isPending,
    isDeletingPet: deletePetMutation.isPending,
    isUploadingImage: uploadPetImageMutation.isPending,
  }
}

export function usePet(id: string) {
  const {
    data: pet,
    isLoading,
    error,
  } = useQuery<Pet>({
    queryKey: ['pet', id],
    queryFn: async () => {
      const response = await apiClient.get(`${endpoints.pets.list}/${id}`)
      return response.data as Pet
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    pet,
    isLoading,
    error,
  }
}
