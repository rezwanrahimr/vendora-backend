import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export class RegisterVendorDto extends RegisterDto {
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  taxId?: string;
  description?: string;
}
