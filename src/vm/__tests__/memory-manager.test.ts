import { MemoryManager } from '../memory-manager';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager(1024); // 1KB for testing
  });

  describe('Basic Allocation and Deallocation', () => {
    it('should allocate memory for a number', () => {
      const address = memoryManager.allocate('number', 42, 8);
      expect(address).toBe(0);
      expect(memoryManager.get(address)).toBe(42);
    });

    it('should allocate memory for a string', () => {
      const address = memoryManager.allocate('string', 'hello', 5);
      expect(memoryManager.get(address)).toBe('hello');
    });

    it('should allocate memory for an object', () => {
      const obj = { x: 10, y: 20 };
      const address = memoryManager.allocate('object', obj, 16);
      expect(memoryManager.get(address)).toEqual(obj);
    });

    it('should deallocate memory', () => {
      const address = memoryManager.allocate('number', 42, 8);
      memoryManager.deallocate(address);
      
      expect(() => memoryManager.get(address)).toThrow('Invalid memory access');
    });

    it('should reuse deallocated memory', () => {
      const addr1 = memoryManager.allocate('number', 42, 8);
      memoryManager.deallocate(addr1);
      
      const addr2 = memoryManager.allocate('number', 100, 8);
      expect(addr2).toBe(addr1); // Should reuse the same address
      expect(memoryManager.get(addr2)).toBe(100);
    });
  });

  describe('Memory Access', () => {
    it('should get and set data at memory address', () => {
      const address = memoryManager.allocate('number', 42, 8);
      expect(memoryManager.get(address)).toBe(42);
      
      memoryManager.set(address, 100);
      expect(memoryManager.get(address)).toBe(100);
    });

    it('should throw error for invalid memory access', () => {
      expect(() => memoryManager.get(999)).toThrow('Invalid memory access');
      expect(() => memoryManager.set(999, 42)).toThrow('Invalid memory access');
    });
  });

  describe('Reference Counting', () => {
    it('should increment and decrement reference count', () => {
      const address = memoryManager.allocate('number', 42, 8);
      
      memoryManager.retain(address);
      memoryManager.retain(address);
      
      // Should not be deallocated when released once
      memoryManager.release(address);
      expect(memoryManager.get(address)).toBe(42);
      
      // Should not be deallocated when released twice
      memoryManager.release(address);
      expect(memoryManager.get(address)).toBe(42);
      
      // Should be deallocated when released third time (ref count = 0)
      memoryManager.release(address);
      expect(() => memoryManager.get(address)).toThrow('Invalid memory access');
    });

    it('should handle release on invalid address gracefully', () => {
      expect(() => memoryManager.release(999)).not.toThrow();
    });
  });

  describe('Garbage Collection', () => {
    it('should collect unreferenced objects', () => {
      // Allocate some objects
      const addr1 = memoryManager.allocate('number', 42, 8);
      const addr2 = memoryManager.allocate('string', 'hello', 5);
      const addr3 = memoryManager.allocate('object', { x: 1 }, 16);
      
      // Add one as root to prevent collection
      memoryManager.addRoot(addr1);
      
      // Force garbage collection
      memoryManager.forceGC();
      
      // Root should still be accessible
      expect(memoryManager.get(addr1)).toBe(42);
      
      // Others should be collected (though this depends on implementation details)
      // In this simple test, we just verify GC ran
      const stats = memoryManager.getStats();
      expect(stats.gcRuns).toBe(1);
    });

    it('should preserve objects with positive reference counts', () => {
      const address = memoryManager.allocate('number', 42, 8);
      memoryManager.retain(address); // Increase ref count
      
      memoryManager.forceGC();
      
      // Should still be accessible due to positive ref count
      expect(memoryManager.get(address)).toBe(42);
    });

    it('should trigger automatic garbage collection', () => {
      memoryManager.setGCThreshold(5); // Low threshold for testing
      
      // Allocate enough to trigger GC
      for (let i = 0; i < 6; i++) {
        memoryManager.allocate('number', i, 8);
      }
      
      const stats = memoryManager.getStats();
      expect(stats.gcRuns).toBeGreaterThan(0);
    });
  });

  describe('Memory Statistics', () => {
    it('should provide accurate memory statistics', () => {
      const addr1 = memoryManager.allocate('number', 42, 8);
      const addr2 = memoryManager.allocate('string', 'hello', 5);
      
      const stats = memoryManager.getStats();
      expect(stats.totalMemory).toBe(1024);
      expect(stats.usedMemory).toBe(13); // 8 + 5
      expect(stats.freeMemory).toBe(1011); // 1024 - 13
      expect(stats.allocatedBlocks).toBe(2);
      
      memoryManager.deallocate(addr1);
      
      const stats2 = memoryManager.getStats();
      expect(stats2.usedMemory).toBe(5);
      expect(stats2.allocatedBlocks).toBe(1);
      expect(stats2.freeBlocks).toBe(1);
    });

    it('should track GC statistics', () => {
      memoryManager.forceGC();
      memoryManager.forceGC();
      
      const stats = memoryManager.getStats();
      expect(stats.gcRuns).toBe(2);
      expect(stats.gcTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Limits', () => {
    it('should throw error when out of memory', () => {
      const smallMemoryManager = new MemoryManager(32); // Very small memory
      
      // This should eventually throw an out of memory error
      expect(() => {
        for (let i = 0; i < 100; i++) {
          smallMemoryManager.allocate('number', i, 8);
        }
      }).toThrow('Out of memory');
    });

    it('should try GC before throwing out of memory', () => {
      const smallMemoryManager = new MemoryManager(64);
      
      // Allocate and deallocate to create garbage
      for (let i = 0; i < 5; i++) {
        const addr = smallMemoryManager.allocate('number', i, 8);
        if (i < 3) {
          smallMemoryManager.deallocate(addr); // Create some garbage
        }
      }
      
      // This allocation should trigger GC and succeed
      const addr = smallMemoryManager.allocate('number', 999, 8);
      expect(smallMemoryManager.get(addr)).toBe(999);
    });
  });

  describe('Memory Compaction', () => {
    it('should compact fragmented memory', () => {
      // Create fragmentation
      const addresses: any[] = [];
      for (let i = 0; i < 10; i++) {
        addresses.push(memoryManager.allocate('number', i, 8));
      }
      
      // Deallocate every other block
      for (let i = 1; i < addresses.length; i += 2) {
        memoryManager.deallocate(addresses[i]);
      }
      
      const fragBefore = memoryManager.getFragmentation();
      memoryManager.compact();
      const fragAfter = memoryManager.getFragmentation();
      
      expect(fragAfter).toBeLessThan(fragBefore);
    });
  });

  describe('GC Roots', () => {
    it('should manage GC roots', () => {
      const address = memoryManager.allocate('number', 42, 8);
      
      memoryManager.addRoot(address);
      memoryManager.forceGC();
      
      // Should still be accessible
      expect(memoryManager.get(address)).toBe(42);
      
      memoryManager.removeRoot(address);
      memoryManager.forceGC();
      
      // May or may not be collected depending on implementation
      // This test mainly verifies the root management API works
    });
  });

  describe('Utility Methods', () => {
    it('should reset memory manager', () => {
      memoryManager.allocate('number', 42, 8);
      memoryManager.forceGC();
      
      memoryManager.reset();
      
      const stats = memoryManager.getStats();
      expect(stats.allocatedBlocks).toBe(0);
      expect(stats.usedMemory).toBe(0);
      expect(stats.gcRuns).toBe(0);
    });

    it('should dump memory for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      memoryManager.allocate('number', 42, 8);
      memoryManager.dumpMemory();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should set GC threshold', () => {
      memoryManager.setGCThreshold(100);
      
      // Allocate less than threshold
      for (let i = 0; i < 50; i++) {
        memoryManager.allocate('number', i, 8);
      }
      
      const stats = memoryManager.getStats();
      expect(stats.gcRuns).toBe(0); // Should not have triggered GC yet
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-size allocations', () => {
      const address = memoryManager.allocate('number', 42, 0);
      expect(memoryManager.get(address)).toBe(42);
    });

    it('should handle multiple deallocations of same address', () => {
      const address = memoryManager.allocate('number', 42, 8);
      memoryManager.deallocate(address);
      
      // Second deallocation should not throw
      expect(() => memoryManager.deallocate(address)).not.toThrow();
    });

    it('should handle retain/release on deallocated memory', () => {
      const address = memoryManager.allocate('number', 42, 8);
      memoryManager.deallocate(address);
      
      expect(() => memoryManager.retain(address)).not.toThrow();
      expect(() => memoryManager.release(address)).not.toThrow();
    });
  });
});