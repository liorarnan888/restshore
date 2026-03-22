import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IntakeSession } from "@/lib/types";

type StoreShape = {
  sessions: Record<string, IntakeSession>;
  resumeIndex: Record<string, string>;
};

const storePath = path.join(process.cwd(), "data", "sessions.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    const initial: StoreShape = {
      sessions: {},
      resumeIndex: {},
    };

    await writeFile(storePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as StoreShape;
}

async function writeStore(store: StoreShape) {
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function saveSession(session: IntakeSession) {
  const store = await readStore();
  store.sessions[session.id] = session;
  store.resumeIndex[session.resumeToken] = session.id;
  await writeStore(store);
  return session;
}

export async function getSessionById(sessionId: string) {
  const store = await readStore();
  return store.sessions[sessionId] ?? null;
}

export async function getSessionByResumeToken(token: string) {
  const store = await readStore();
  const sessionId = store.resumeIndex[token];
  return sessionId ? store.sessions[sessionId] ?? null : null;
}

export async function listSessions() {
  const store = await readStore();
  return Object.values(store.sessions);
}
