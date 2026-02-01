import { Test, TestingModule } from '@nestjs/testing';
import { AuthRefreshTokensService } from './auth-refresh-tokens.service';

describe('AuthRefreshTokenService', () => {
  let service: AuthRefreshTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRefreshTokensService],
    }).compile();

    service = module.get<AuthRefreshTokensService>(AuthRefreshTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
