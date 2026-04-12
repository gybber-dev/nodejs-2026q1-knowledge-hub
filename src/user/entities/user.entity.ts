import { UserRole } from '../../common/enums/user-role.enum';

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}
