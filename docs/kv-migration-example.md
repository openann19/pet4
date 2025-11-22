/\*\*

- KV Migration Example - KRASIVO Edition
-
- Shows how to replace all localStorage/KV operations with React Query
- for offline-first, server-backed data management
  \*/

// ❌ BEFORE: KV/localStorage pattern
/\*
const OLD_PATTERN = {
// Getting data
getUserPets: async () => {
const cached = localStorage.getItem('user-pets');
if (cached) return JSON.parse(cached);

    const response = await fetch('/api/pets');
    const data = await response.json();
    localStorage.setItem('user-pets', JSON.stringify(data));
    return data;

},

// Setting data  
 updateUserPet: async (petId: string, updates: any) => {
const response = await fetch(`/api/pets/${petId}`, {
method: 'PATCH',
body: JSON.stringify(updates)
});

    // Manual cache invalidation
    localStorage.removeItem('user-pets');
    return response.json();

}
};
\*/

// ✅ AFTER: React Query pattern
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

// API functions (pure, no caching logic)
const petsAPI = {
getAll: () => fetch('/api/pets').then(r => r.json()),
update: (id: string, data: any) =>
fetch(`/api/pets/${id}`, {
method: 'PATCH',
body: JSON.stringify(data)
}).then(r => r.json()),
};

// Hooks with automatic caching, offline support, optimistic updates
export function useUserPets() {
return useQuery({
queryKey: queryKeys.user.pets,
queryFn: petsAPI.getAll,
staleTime: 5 _ 60 _ 1000, // 5 minutes
// Automatically cached with IndexedDB/AsyncStorage
// Background sync when online
// Optimistic updates with rollback on error
});
}

export function useUpdatePet() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: ({ id, data }: { id: string; data: any }) =>
petsAPI.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.pets });

      const previousPets = queryClient.getQueryData(queryKeys.user.pets);

      queryClient.setQueryData(queryKeys.user.pets, (old: any[]) =>
        old?.map(pet => pet.id === id ? { ...pet, ...data } : pet) ?? []
      );

      return { previousPets };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousPets) {
        queryClient.setQueryData(queryKeys.user.pets, context.previousPets);
      }
    },

    // Refresh on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.pets });
    },

});
}

// Usage in components
export function PetProfile({ petId }: { petId: string }) {
const { data: pets, isLoading, error } = useUserPets();
const updatePet = useUpdatePet();

const pet = pets?.find(p => p.id === petId);

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!pet) return <div>Pet not found</div>;

const handleUpdate = (updates: any) => {
updatePet.mutate({ id: petId, data: updates });
};

return (

<div>
<h1>{pet.name}</h1>
<button onClick={() => handleUpdate({ name: 'New Name' })}>
Update Name
</button>
{updatePet.isPending && <span>Updating...</span>}
</div>
);
}

// Migration checklist:
// 1. ✅ Replace localStorage.getItem/setItem with useQuery
// 2. ✅ Replace manual fetch + cache with useMutation
// 3. ✅ Add optimistic updates for instant UI feedback
// 4. ✅ Add error handling with rollback
// 5. ✅ Add offline persistence (automatic with our setup)
// 6. ✅ Add background sync (automatic with our setup)
// 7. ✅ Remove all localStorage/KV calls
// 8. ✅ Remove manual cache invalidation logic

// Performance benefits:
// - Automatic deduplication of identical requests
// - Background updates when app regains focus
// - Intelligent retry with exponential backoff
// - Memory management with automatic garbage collection
// - Optimistic updates for 60fps UI responsiveness
