import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

/**
 * Use this decorator for endpoints that require raw JWT tokens
 * Shows lock icon in Swagger UI
 * @param headerName optional, defaults to 'Authorization'
 */
export function ApiJwtToken(headerName = 'Authorization') {
  return applyDecorators(
    // Add lock icon in Swagger by linking to a security scheme
    ApiSecurity('JWT'),
    // Still document the header for clarity
    ApiHeader({
      name: headerName,
      description: 'JWT token (raw, no Bearer prefix)',
      required: true,
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // optional example
    }),
  );
}
