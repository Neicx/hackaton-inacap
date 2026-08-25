import { SetMetadata } from '@nestjs/common';

export const NO_AUTH_REQUIRED_KEY = 'noAuthRequired';

export const NoAuthRequired = () => SetMetadata(NO_AUTH_REQUIRED_KEY, true);
