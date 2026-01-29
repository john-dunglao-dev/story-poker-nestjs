export interface DecodedJwt {
  sub: number;
  email: string;
}

export interface JwtUserPayload extends DecodedJwt {
  iat: number;
  exp: number;
}
