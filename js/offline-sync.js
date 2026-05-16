/**
 * Offline Sync & Local Storage Persistence Manager
 * Handles saving and retrieving data securely using user.id as a namespace
 * Ensures data persists across sessions but stays isolated per user.
 */

class OfflineSyncManager {
    constructor() {
        this.cachePrefix = 'smart_health_';
    }

    _getKey(userId, key) {
        if (!userId) return null;
        return `${this.cachePrefix}${userId}_${key}`;
    }

    /** Save entire profile object */
    saveProfile(userId, profileData) {
        if (!userId) return;
        const key = this._getKey(userId, 'profile');
        localStorage.setItem(key, JSON.stringify(profileData));
    }

    /** Retrieve profile object */
    getProfile(userId) {
        if (!userId) return null;
        const key = this._getKey(userId, 'profile');
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    /** Save an array of medical records */
    saveRecords(userId, recordsArray) {
        if (!userId) return;
        const key = this._getKey(userId, 'records');
        localStorage.setItem(key, JSON.stringify(recordsArray));
    }

    /** Retrieve array of medical records */
    getRecords(userId) {
        if (!userId) return [];
        const key = this._getKey(userId, 'records');
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    }

    /** Add a single record to the local cache */
    addRecord(userId, recordObj) {
        if (!userId) return;
        const records = this.getRecords(userId);
        records.unshift(recordObj); // Add to beginning
        this.saveRecords(userId, records);
    }

    /** Clear all data for a specific user (on logout) */
    clearUserData(userId) {
        if (!userId) return;
        localStorage.removeItem(this._getKey(userId, 'profile'));
        localStorage.removeItem(this._getKey(userId, 'records'));
        // Clear old global caches if they exist
        localStorage.removeItem('cached_health_profile');
    }

    /** Attempt to push local-only records to Supabase */
    async syncWithBackend(userId) {
        if (!userId || !window.supabaseClient) return;
        const records = this.getRecords(userId);
        if (records.length === 0) return;

        let syncSuccessful = true;
        const remainingRecords = [];

        for (const record of records) {
            // Check if it's a locally generated record
            if (record.id && String(record.id).startsWith('local-')) {
                const { error } = await window.supabaseClient.from('medical_records').insert([{
                    user_id: userId,
                    diagnosis: record.diagnosis,
                    prescription: record.prescription,
                    created_at: record.created_at
                }]);

                if (error) {
                    console.warn('Failed to sync record to backend:', error);
                    syncSuccessful = false;
                    remainingRecords.push(record);
                } else {
                    console.log('Successfully synced local record to backend!');
                }
            } else {
                // If it doesn't have a local- ID for some reason, we keep it just in case, or drop it
                // We'll assume if it's in the local queue, it needs to be synced.
                remainingRecords.push(record);
            }
        }

        // Update local storage with any records that failed to sync
        if (remainingRecords.length !== records.length) {
            this.saveRecords(userId, remainingRecords);
            if (window.showToast) {
                window.showToast("Offline records successfully synced to cloud!", "success");
            }
        }
    }
}

window.offlineSync = new OfflineSyncManager();

// Automatically trigger sync when coming online
window.addEventListener('online', async () => {
    if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            window.offlineSync.syncWithBackend(user.id);
        }
    }
});