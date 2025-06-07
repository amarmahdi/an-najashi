/**
 * Mock implementation of AsyncStorage
 * Used as a fallback when the real AsyncStorage cannot be loaded
 */

class MockAsyncStorage {
  private storage: Record<string, string> = {};

  /**
   * Store a string value with the provided key
   */
  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
    console.log('MockAsyncStorage: Stored value for key:', key);
  }

  /**
   * Get a string value for the provided key
   */
  async getItem(key: string): Promise<string | null> {
    const value = this.storage[key] || null;
    console.log('MockAsyncStorage: Retrieved value for key:', key, value ? '(found)' : '(not found)');
    return value;
  }

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
    console.log('MockAsyncStorage: Removed item with key:', key);
  }

  /**
   * Clear all stored items
   */
  async clear(): Promise<void> {
    this.storage = {};
    console.log('MockAsyncStorage: Storage cleared');
  }

  /**
   * Get all keys in storage
   */
  async getAllKeys(): Promise<string[]> {
    const keys = Object.keys(this.storage);
    console.log('MockAsyncStorage: Retrieved all keys, count:', keys.length);
    return keys;
  }

  /**
   * Get multiple items at once
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const result: [string, string | null][] = keys.map(key => [key, this.storage[key] || null]);
    console.log('MockAsyncStorage: Retrieved multiple items, count:', keys.length);
    return result;
  }

  /**
   * Store multiple items at once
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    keyValuePairs.forEach(([key, value]) => {
      this.storage[key] = value;
    });
    console.log('MockAsyncStorage: Stored multiple items, count:', keyValuePairs.length);
  }

  /**
   * Remove multiple items at once
   */
  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => {
      delete this.storage[key];
    });
    console.log('MockAsyncStorage: Removed multiple items, count:', keys.length);
  }

  /**
   * Merge an existing value with a new value
   */
  async mergeItem(key: string, value: string): Promise<void> {
    try {
      const existingValue = this.storage[key];
      if (existingValue) {
        const existingObj = JSON.parse(existingValue);
        const valueObj = JSON.parse(value);
        this.storage[key] = JSON.stringify({ ...existingObj, ...valueObj });
      } else {
        this.storage[key] = value;
      }
      console.log('MockAsyncStorage: Merged item with key:', key);
    } catch (error) {
      console.error('MockAsyncStorage: Error merging item:', error);
      this.storage[key] = value;
    }
  }
}

export default new MockAsyncStorage(); 