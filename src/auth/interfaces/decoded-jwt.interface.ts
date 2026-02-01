export interface DecodedJwt {
  sub: number;
}

export interface JwtUserPayload extends DecodedJwt {
  iat: number;
  exp: number;
}
