import { openDB, DBSchema } from 'idb';
import { DriveFile } from '../types';

interface FinderDriveDB extends DBSchema {
    folders: {
        key: string;
        value: {
            id: string;
            items: DriveFile[];
            timestamp: number;
        };
    };
}

const DB_NAME = 'finderdrive-db';
const RESULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const initDB = async () => {
    return openDB<FinderDriveDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('folders')) {
                db.createObjectStore('folders', { keyPath: 'id' });
            }
        },
    });
};

export const getCachedFolder = async (folderId: string): Promise<DriveFile[] | null> => {
    try {
        const db = await initDB();
        const entry = await db.get('folders', folderId);

        if (!entry) return null;

        if (Date.now() - entry.timestamp > RESULT_CACHE_TTL) {
            // Expired
            await db.delete('folders', folderId);
            return null;
        }

        return entry.items;
    } catch (error) {
        console.warn('IDB Get Error', error);
        return null;
    }
};

export const setCachedFolder = async (folderId: string, items: DriveFile[]) => {
    try {
        const db = await initDB();
        await db.put('folders', {
            id: folderId,
            items,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.warn('IDB Put Error', error);
    }
};

export const invalidateFolder = async (folderId: string) => {
    try {
        const db = await initDB();
        await db.delete('folders', folderId);
    } catch (error) {
        console.warn('IDB Delete Error', error);
    }
};
