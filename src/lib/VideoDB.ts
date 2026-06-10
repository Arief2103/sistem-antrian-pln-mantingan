// Helper library to store and retrieve large custom video files on the client-side using IndexedDB.
// This is extremely robust, has no strict size limits, and persists across browser reloads.

const DB_NAME = "PLNQueueVideoDB";
const STORE_NAME = "videos";
const DB_VERSION = 1;

interface VideoMetadata {
  name: string;
  type: string;
  blob: Blob;
}

export function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open video database."));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveVideoBlob(file: File): Promise<void> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const data: VideoMetadata = {
      name: file.name,
      type: file.type,
      blob: file,
    };

    const request = store.put(data, "uploaded-tv-video");

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to save video to database."));
    };
  });
}

export async function getVideoBlob(): Promise<{ name: string; type: string; blob: Blob } | null> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("uploaded-tv-video");

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve video from database."));
    };
  });
}

export async function deleteVideoBlob(): Promise<void> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete("uploaded-tv-video");

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete video."));
    };
  });
}
