import type { User as ContractsUser } from './contracts';

export interface User extends ContractsUser {
  name?: string;
}
