export type UserRole = 'user' | 'admin';

export interface Session {
  userId: string;
  role: UserRole;
}
