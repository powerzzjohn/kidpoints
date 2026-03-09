export interface User {
  id: string;
  username: string;
  role: 'PARENT' | 'CHILD';
  familyId: string;
  avatar?: string;
  theme: 'PVZ' | 'MINECRAFT';
}

export interface AuthResponse {
  token: string;
  user: User;
}
