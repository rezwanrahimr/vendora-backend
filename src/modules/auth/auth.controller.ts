import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterVendorDto, LoginDto, VerifyEmailDto, SendResetCodeDto, VerifyResetCodeDto, ConfirmResetPasswordDto, ChangePasswordDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/vendor')
  async registerVendor(@Body() registerVendorDto: RegisterVendorDto) {
    return this.authService.registerVendor(registerVendorDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('password-reset/send-code')
  @ApiOperation({ summary: 'Step 1: Send password reset verification code to email' })
  @ApiResponse({ status: 200, description: 'Verification code sent if account exists' })
  async sendResetCode(@Body() sendResetCodeDto: SendResetCodeDto) {
    return this.authService.sendResetCode(sendResetCodeDto);
  }

  @Post('password-reset/verify-code')
  @ApiOperation({ summary: 'Step 2: Verify code and get reset token' })
  @ApiResponse({ status: 200, description: 'Code verified, reset token returned' })
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyResetCodeDto);
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Step 3: Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async confirmResetPassword(@Body() confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return this.authService.confirmResetPassword(confirmResetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and blacklist current token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.sub, token);
  }
}
