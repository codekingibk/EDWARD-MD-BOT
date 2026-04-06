import mongoose, { Schema, model } from 'mongoose';
import {
  BufferJSON,
  initAuthCreds,
  proto,
} from '@whiskeysockets/baileys';
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys';
import { logger } from './logger';

const log = logger.child({ module: 'MongoAuth' });

// ── MongoDB collection for Baileys auth state ─────────────────────────────────
interface IAuthDoc {
  key: string;
  value: string;
}

const AuthDocSchema = new Schema<IAuthDoc>({
  key:   { type: String, required: true, unique: true, index: true },
  value: { type: String, required: true },
});

// Avoid OverwriteModelError on hot reload
let AuthDoc: ReturnType<typeof model<IAuthDoc>>;
try {
  AuthDoc = mongoose.model<IAuthDoc>('__wa_auth_state__');
} catch {
  AuthDoc = model<IAuthDoc>('__wa_auth_state__', AuthDocSchema);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function dbGet(key: string): Promise<any> {
  try {
    const doc = await AuthDoc.findOne({ key }).lean() as IAuthDoc | null;
    if (!doc) return undefined;
    return JSON.parse(doc.value, BufferJSON.reviver);
  } catch (err: any) {
    log.warn({ err: err.message, key }, 'Auth state read failed');
    return undefined;
  }
}

async function dbSet(key: string, value: any): Promise<void> {
  try {
    const serialized = JSON.stringify(value, BufferJSON.replacer);
    await AuthDoc.findOneAndUpdate(
      { key },
      { value: serialized },
      { upsert: true, new: true }
    );
  } catch (err: any) {
    log.warn({ err: err.message, key }, 'Auth state write failed');
  }
}

async function dbDel(key: string): Promise<void> {
  try {
    await AuthDoc.deleteOne({ key });
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true if there is a saved WhatsApp session in MongoDB.
 */
export async function mongoAuthExists(): Promise<boolean> {
  try {
    const count = await AuthDoc.countDocuments({});
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Clears all WhatsApp auth state from MongoDB.
 */
export async function clearMongoAuth(): Promise<void> {
  try {
    await AuthDoc.deleteMany({});
    log.info('Cleared WhatsApp auth state from MongoDB');
  } catch (err: any) {
    log.warn({ err: err.message }, 'Failed to clear mongo auth state');
  }
}

/**
 * A MongoDB-backed replacement for Baileys' useMultiFileAuthState().
 * Stores all credentials and signal keys in the __wa_auth_state__ collection.
 */
export async function useMongoAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  // Load (or initialise) credentials
  let creds: AuthenticationCreds = (await dbGet('creds')) ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        async get(type: keyof SignalDataTypeMap, ids: string[]) {
          const data: Partial<Record<string, SignalDataTypeMap[typeof type]>> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await dbGet(`${type}:${id}`);
              if (value && type === 'app-state-sync-key') {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              if (value !== undefined) data[id] = value;
            })
          );
          return data as { [id: string]: SignalDataTypeMap[typeof type] };
        },

        async set(data: Partial<{ [T in keyof SignalDataTypeMap]: { [id: string]: SignalDataTypeMap[T] | null } }>) {
          await Promise.all(
            Object.entries(data).flatMap(([type, entries]) =>
              Object.entries(entries ?? {}).map(([id, value]) => {
                const key = `${type}:${id}`;
                return value != null ? dbSet(key, value) : dbDel(key);
              })
            )
          );
        },
      },
    },

    saveCreds: async () => {
      await dbSet('creds', creds);
    },
  };
}
