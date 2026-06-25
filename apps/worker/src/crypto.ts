import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY is not set — generate with: openssl rand -hex 32')
  }
  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes), got ${keyHex.length}`,
    )
  }
  return Buffer.from(keyHex, 'hex')
}

export interface EncryptedData {
  cipher: string
  iv: string
  tag: string
}
