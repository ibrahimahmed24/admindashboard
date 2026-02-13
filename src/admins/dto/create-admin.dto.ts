import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateAdminDto {
  @IsEmail({}, { message: 'please entet a valid emali address' })
  email: string;

  @IsString({ message: 'please enter a valid password' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsNotEmpty({ message: 'name should not be empty' })
  @IsString({ message: 'please enter a valid name' })
  @MinLength(6, { message: 'first name  must be at least 6 characters long' })
  name: string;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}
