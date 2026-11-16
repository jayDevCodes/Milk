import { argon2, randomBytes, timingSafeEqual } from "node:crypto";

const MEMORY_KIB = 19_456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;
const SALT_LENGTH = 16;

function derive(password: string, salt: Buffer, memory: number, passes: number, parallelism: number, tagLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2("argon2id", {
      message: Buffer.from(password, "utf8"),
      nonce: salt,
      memory,
      passes,
      parallelism,
      tagLength,
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function encodeBase64(value: Buffer): string {
  return value.toString("base64").replace(/=+$/u, "");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const digest = await derive(password, salt, MEMORY_KIB, PASSES, PARALLELISM, TAG_LENGTH);
  return "$argon2id$v=19$m=" + MEMORY_KIB + ",t=" + PASSES + ",p=" + PARALLELISM +
    "$" + encodeBase64(salt) + "$" + encodeBase64(digest);
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/u.exec(encoded);
  if (!match) return false;

  const memory = Number(match[1]);
  const passes = Number(match[2]);
  const parallelism = Number(match[3]);
  const salt = Buffer.from(match[4]!, "base64");
  const expected = Buffer.from(match[5]!, "base64");

  if (
    !Number.isInteger(memory) || memory < MEMORY_KIB || memory > 262_144 ||
    !Number.isInteger(passes) || passes < PASSES || passes > 10 ||
    !Number.isInteger(parallelism) || parallelism < 1 || parallelism > 4 ||
    salt.length < SALT_LENGTH || salt.length > 64 ||
    expected.length !== TAG_LENGTH
  ) return false;

  const actual = await derive(password, salt, memory, passes, parallelism, expected.length);
  return timingSafeEqual(actual, expected);
}
