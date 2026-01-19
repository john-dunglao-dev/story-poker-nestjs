export interface DecodedJwt {
  sub: number;
  username: string;
}

export interface JwtUserPayload extends DecodedJwt {
  iat: number;
  exp: number;
}
