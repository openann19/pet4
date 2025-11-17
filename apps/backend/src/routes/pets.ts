import { Router } from 'express';
import {
  listPets,
  createPet,
  getPet,
  updatePet,
  deletePet,
} from '../controllers/pets.js';
import { authenticate } from '../middleware/auth.js';

export const petsRouter = Router();

// All pet routes require authentication
petsRouter.use(authenticate);

// Pet routes
petsRouter.get('/', listPets);
petsRouter.post('/', createPet);
petsRouter.get('/:id', getPet);
petsRouter.put('/:id', updatePet);
petsRouter.patch('/:id', updatePet);
petsRouter.delete('/:id', deletePet);

