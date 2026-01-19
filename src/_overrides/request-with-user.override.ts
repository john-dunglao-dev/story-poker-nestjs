import { JwtUserPayload } from 'src/auth/interfaces/decoded-jwt.interface';

export class RequestWithUserOverride extends Request {
  public user?: JwtUserPayload;
}
