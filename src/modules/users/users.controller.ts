import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('users')
@ApiSecurity("JWT") // Apply JWT security scheme to all endpoints in this controller
@UseGuards(JwtAuthGuard) // All routes require authentication
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  // @Get()
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  // totalUsers(){
  //   return this.usersService.totalUsers();
  // }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can see all users
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  // Get current user profile - no role restriction
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can view other users
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can update users
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { name?: string; isActive?: boolean },
  ) {
    return this.usersService.updateUser(id, updateData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can delete users
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
