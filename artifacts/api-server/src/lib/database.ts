import mongoose, { Schema, model, type Document } from 'mongoose';
import { logger } from './logger';

const log = logger.child({ module: 'Database' });

// ── User Schema ───────────────────────────────────────────────────────────────
export interface IUser extends Document {
  jid: string;
  name: string;
  phone: string;
  isPremium: boolean;
  serverId: string;
  firstSeen: Date;
  lastSeen: Date;
  messageCount: number;
  commandCount: number;
}

const UserSchema = new Schema<IUser>({
  jid: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  serverId: { type: String, default: 'main' },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  commandCount: { type: Number, default: 0 },
});

// ── Server Schema ─────────────────────────────────────────────────────────────
export interface IServer extends Document {
  serverId: string;
  name: string;
  tier: 'free' | 'premium';
  maxUsers: number;
  maxStorageMB: number;
  usedStorageMB: number;
  isActive: boolean;
  createdAt: Date;
}

const ServerSchema = new Schema<IServer>({
  serverId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  tier: { type: String, enum: ['free', 'premium'], default: 'free' },
  maxUsers: { type: Number, default: 500 },
  maxStorageMB: { type: Number, default: 500 },
  usedStorageMB: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', UserSchema);
export const Server = model<IServer>('Server', ServerSchema);

// ── Connection ────────────────────────────────────────────────────────────────
let connected = false;

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    log.warn('MONGODB_URI not set — running without persistent database');
    return false;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    connected = true;
    log.info('Connected to MongoDB Atlas');

    // Ensure default server record exists
    const exists = await Server.findOne({ serverId: 'main' }).lean();
    if (!exists) {
      await Server.create({
        serverId: 'main',
        name: 'EDWARD MD Main Server',
        tier: 'free',
        maxUsers: 500,
        maxStorageMB: 500,
        usedStorageMB: 0,
        isActive: true,
        createdAt: new Date(),
      });
    }

    return true;
  } catch (err: any) {
    log.error({ err: err.message }, 'MongoDB connection failed — running in memory-only mode');
    return false;
  }
}

export function isConnected(): boolean {
  return connected && mongoose.connection.readyState === 1;
}

// ── User helpers ──────────────────────────────────────────────────────────────
export async function upsertUser(jid: string, name?: string, serverId = 'main'): Promise<void> {
  if (!isConnected()) return;
  try {
    const phone = jid.split('@')[0].split(':')[0];
    await User.findOneAndUpdate(
      { jid },
      {
        $set: { lastSeen: new Date(), serverId, ...(name ? { name } : {}) },
        $setOnInsert: { phone, firstSeen: new Date() },
        $inc: { messageCount: 1 },
      },
      { upsert: true, new: true }
    );
  } catch (err: any) {
    log.warn({ err: err.message }, 'upsertUser error');
  }
}

export async function getUserCount(serverId?: string): Promise<number> {
  if (!isConnected()) return 0;
  try {
    return await User.countDocuments(serverId ? { serverId } : {});
  } catch {
    return 0;
  }
}

export async function getServerInfo(serverId = 'main'): Promise<IServer | null> {
  if (!isConnected()) return null;
  try {
    return await Server.findOne({ serverId });
  } catch {
    return null;
  }
}

export async function getAllServers(): Promise<IServer[]> {
  if (!isConnected()) return [];
  try {
    return await Server.find({ isActive: true }).sort({ tier: -1, createdAt: 1 });
  } catch {
    return [];
  }
}

export async function updateServerStorage(serverId: string, usedMB: number): Promise<void> {
  if (!isConnected()) return;
  try {
    await Server.findOneAndUpdate({ serverId }, { $set: { usedStorageMB: usedMB } });
  } catch {}
}
