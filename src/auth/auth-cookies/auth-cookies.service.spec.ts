import { Test, TestingModule } from '@nestjs/testing';
import { AuthCookiesService } from './auth-cookies.service';

describe('AuthCookiesService', () => {
  let service: AuthCookiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthCookiesService],
    }).compile();

    service = module.get<AuthCookiesService>(AuthCookiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
