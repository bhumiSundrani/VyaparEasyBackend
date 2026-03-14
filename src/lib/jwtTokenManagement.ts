import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { env } from '../config/env'

const secret = env.JWT_SECRET
if (!secret) {
  throw new Error("JWT_SECRET is not defined in environment variables")
}

// Convert secret string to Uint8Array
const secretKey = new TextEncoder().encode(secret)

export interface JWTToken extends JWTPayload {
  userId: string;
  phone: string;
  name: string;
  shopName: string;
  preferredLanguage: string;
}

// Generate token (valid for 7 days)
export async function generateToken(payload: JWTToken): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

// Verify token and ensure it matches your expected structure
export async function verifyToken(token: string | null): Promise<JWTToken | null> {
  if (!token) {
    console.log("No token found")
    return null
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)
    
    // Type guard function to check if payload matches JWTToken structure
    function isJWTToken(payload: JWTPayload): payload is JWTPayload & JWTToken {
      return (
        typeof payload.userId === 'string' &&
        typeof payload.phone === 'string' &&
        typeof payload.name === 'string' &&
        typeof payload.shopName === 'string' &&
        typeof payload.preferredLanguage === 'string'
      )
    }

    if (isJWTToken(payload)) {
      return {
        userId: payload.userId,
        phone: payload.phone,
        name: payload.name,
        shopName: payload.shopName,
        preferredLanguage: payload.preferredLanguage
      }
    } else {
      console.warn("JWT payload does not match expected structure")
      return null
    }
  } catch (err) {
    console.error("Invalid token:", err)
    return null
  }
}