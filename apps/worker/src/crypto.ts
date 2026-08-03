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

export function encrypt(plaintext: string): EncryptedData {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    cipher: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

export function decrypt(data: EncryptedData): string {
  const key = getKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(data.cipher, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}
