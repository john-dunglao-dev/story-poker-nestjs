import { Test, TestingModule } from '@nestjs/testing';
import { AuthAccessTokensService } from './auth-access-tokens.service';

describe('AuthAccessTokensService', () => {
  let service: AuthAccessTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAccessTokensService],
    }).compile();

    service = module.get<AuthAccessTokensService>(AuthAccessTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
