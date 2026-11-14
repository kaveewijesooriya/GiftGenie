import * as SQLite from 'expo-sqlite';

import { migrateDatabase } from './migrations';

const DATABASE_NAME = 'giftgenie-business.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await migrateDatabase(database);
        return database;
      })
      .catch((error: unknown) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

export async function runInTransaction<T>(
  work: (database: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  let result: T | undefined;

  await database.withTransactionAsync(async () => {
    result = await work(database);
  });

  return result as T;
}
