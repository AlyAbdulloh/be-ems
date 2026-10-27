export interface AuthenticatedUser {
  sub: string;
  email: string;
  roles: string[];
  isOrganizer?: boolean;
}
