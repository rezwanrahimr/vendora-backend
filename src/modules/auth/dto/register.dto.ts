import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class RegisterVendorDto extends RegisterDto {
  city: string;
  streetAddress: string;
  zipCode: string;
}
