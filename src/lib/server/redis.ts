import { Redis } from "@upstash/redis";

const client = Redis.fromEnv();

// Redisに値を保存する
const setValue = async <T>(
  key: string,
  value: T,
  expire?: number
): Promise<void> => {
  await client.set(key, JSON.stringify(value));
  if (expire) {
    await client.expire(key, expire);
  }
};

// Redisから値を取得する
const getValue = async <T>(key: string): Promise<T | null> => {
  const value = await client.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value as string) as T;
  } catch {
    return value as unknown as T;
  }
};

// Redisから値を削除する
const deleteKey = async (key: string): Promise<boolean> => {
  const result = await client.del(key);
  return result > 0;
};

// Redisの型付きクライアントを作成する
const typedClient = <T>(keyPrefix: string, defaultExpire?: number) => ({
  async setValue(key: string, value: T, expire?: number) {
    await setValue<T>(`${keyPrefix}:${key}`, value, expire || defaultExpire);
  },
  async getValue(key: string): Promise<T | null> {
    return getValue<T>(`${keyPrefix}:${key}`);
  },
  async deleteKey(key: string): Promise<boolean> {
    return deleteKey(`${keyPrefix}:${key}`);
  },
});

export { client, setValue, getValue, deleteKey, typedClient };
