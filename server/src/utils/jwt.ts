import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  familyId: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};
