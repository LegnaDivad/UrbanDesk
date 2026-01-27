export type Session = {
  userId: string;
  role: 'user' | 'admin';
};

export interface SessionRepo {
  load(): Promise<Session | null>;
  save(next: Session | null): Promise<void>;
}
