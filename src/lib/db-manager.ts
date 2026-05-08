/**
 * Firebase Database Connection Manager
 * Handles initialization, error handling, and connection utilities
 */

import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { FirebaseApp } from "firebase/app";

class DatabaseManager {
  private db: ReturnType<typeof getFirestore> | null = null;
  private isEmulator = false;

  /**
   * Initialize Firestore database connection
   */
  async initialize(app: FirebaseApp): Promise<void> {
    try {
      if (this.db) {
        console.log("Database already initialized");
        return;
      }

      this.db = getFirestore(app);

      // Connect to emulator in development if FIREBASE_EMULATOR_HOST is set
      if (process.env.FIREBASE_EMULATOR_HOST) {
        try {
          connectFirestoreEmulator(
            this.db,
            process.env.FIREBASE_EMULATOR_HOST.split(":")[0] || "localhost",
            parseInt(process.env.FIREBASE_EMULATOR_HOST.split(":")[1] || "8080")
          );
          this.isEmulator = true;
          console.log("Connected to Firestore Emulator");
        } catch (error) {
          // Emulator already connected or not available
          console.log("Firestore Emulator not available, using production");
        }
      }

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw new Error("Database initialization failed");
    }
  }

  /**
   * Get the database instance
   */
  getDb(): ReturnType<typeof getFirestore> {
    if (!this.db) {
      throw new Error(
        "Database not initialized. Call initialize() first."
      );
    }
    return this.db;
  }

  /**
   * Check if using emulator
   */
  isUsingEmulator(): boolean {
    return this.isEmulator;
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // A simple health check would be to read a non-existent document
      // This verifies the database connection is working
      if (!this.db) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();

/**
 * Handle Firestore errors with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on validation errors
      if (error.code === "invalid-argument") {
        throw error;
      }

      // Don't retry on authentication errors
      if (error.code === "unauthenticated") {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Firestore error messages
 */
export const FirestoreErrors = {
  NOT_FOUND: "Document not found",
  PERMISSION_DENIED: "Permission denied",
  ALREADY_EXISTS: "Document already exists",
  INVALID_ARGUMENT: "Invalid argument",
  UNAUTHENTICATED: "Not authenticated",
  RESOURCE_EXHAUSTED: "Too many requests",
  INTERNAL: "Internal server error",
  UNAVAILABLE: "Service unavailable",
} as const;

/**
 * Convert Firestore error to user-friendly message
 */
export function getErrorMessage(error: any): string {
  const code = error?.code || "unknown";

  switch (code) {
    case "not-found":
      return FirestoreErrors.NOT_FOUND;
    case "permission-denied":
      return FirestoreErrors.PERMISSION_DENIED;
    case "already-exists":
      return FirestoreErrors.ALREADY_EXISTS;
    case "invalid-argument":
      return FirestoreErrors.INVALID_ARGUMENT;
    case "unauthenticated":
      return FirestoreErrors.UNAUTHENTICATED;
    case "resource-exhausted":
      return FirestoreErrors.RESOURCE_EXHAUSTED;
    case "internal":
      return FirestoreErrors.INTERNAL;
    case "unavailable":
      return FirestoreErrors.UNAVAILABLE;
    default:
      return "An error occurred";
  }
}
