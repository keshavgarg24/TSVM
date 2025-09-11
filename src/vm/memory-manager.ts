/**
 * Simple memory management system for the TypeScript VM
 */

export interface MemoryBlock {
  address: number;
  size: number;
  allocated: boolean;
  type: 'number' | 'string' | 'object' | 'function';
  data: any;
  refCount: number;
  marked: boolean; // For mark-and-sweep GC
}

export interface MemoryStats {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  allocatedBlocks: number;
  freeBlocks: number;
  gcRuns: number;
  gcTime: number;
}

/**
 * Memory manager with reference counting and mark-and-sweep garbage collection
 */
export class MemoryManager {
  private memory: MemoryBlock[] = [];
  private freeList: number[] = [];
  private nextAddress = 0;
  private gcThreshold = 1000; // Trigger GC after 1000 allocations
  private allocationCount = 0;
  private gcRuns = 0;
  private totalGcTime = 0;
  private roots: Set<number> = new Set(); // GC roots

  constructor(private maxMemory: number = 1024 * 1024) {} // 1MB default

  /**
   * Allocate memory for a value
   */
  allocate(type: MemoryBlock['type'], data: any, size: number = 1): number {
    this.allocationCount++;

    // Check if we need to run garbage collection
    if (this.allocationCount >= this.gcThreshold) {
      this.garbageCollect();
    }

    // Try to reuse a free block
    const freeIndex = this.freeList.findIndex(addr => {
      const block = this.memory[addr];
      return block && block.size >= size;
    });

    let address: number;
    if (freeIndex !== -1) {
      // Reuse existing block
      const freedAddress = this.freeList.splice(freeIndex, 1)[0];
      if (freedAddress === undefined) {
        throw new Error('Failed to allocate memory: free list corruption');
      }
      address = freedAddress;
      const block = this.memory[address];
      if (!block) {
        throw new Error('Failed to allocate memory: invalid block reference');
      }
      block.allocated = true;
      block.type = type;
      block.data = data;
      block.refCount = 1;
      block.marked = false;
    } else {
      // Allocate new block
      address = this.nextAddress++;
      
      // Check memory limit
      if (this.getUsedMemory() + size > this.maxMemory) {
        // Try garbage collection first
        this.garbageCollect();
        
        if (this.getUsedMemory() + size > this.maxMemory) {
          throw new Error('Out of memory');
        }
      }

      this.memory[address] = {
        address,
        size,
        allocated: true,
        type,
        data,
        refCount: 1,
        marked: false
      };
    }

    return address;
  }

  /**
   * Deallocate memory
   */
  deallocate(address: number): void {
    const block = this.memory[address];
    if (!block || !block.allocated) {
      return; // Already deallocated or invalid address
    }

    block.allocated = false;
    block.data = null;
    block.refCount = 0;
    block.marked = false;
    this.freeList.push(address);
  }

  /**
   * Get data at memory address
   */
  get(address: number): any {
    const block = this.memory[address];
    if (!block || !block.allocated) {
      throw new Error(`Invalid memory access at address ${address}`);
    }
    return block.data;
  }

  /**
   * Set data at memory address
   */
  set(address: number, data: any): void {
    const block = this.memory[address];
    if (!block || !block.allocated) {
      throw new Error(`Invalid memory access at address ${address}`);
    }
    block.data = data;
  }

  /**
   * Increment reference count
   */
  retain(address: number): void {
    const block = this.memory[address];
    if (block && block.allocated) {
      block.refCount++;
    }
  }

  /**
   * Decrement reference count and deallocate if zero
   */
  release(address: number): void {
    const block = this.memory[address];
    if (!block || !block.allocated) {
      return;
    }

    block.refCount--;
    if (block.refCount <= 0) {
      this.deallocate(address);
    }
  }

  /**
   * Add a GC root (prevents collection)
   */
  addRoot(address: number): void {
    this.roots.add(address);
  }

  /**
   * Remove a GC root
   */
  removeRoot(address: number): void {
    this.roots.delete(address);
  }

  /**
   * Mark-and-sweep garbage collection
   */
  garbageCollect(): void {
    const startTime = Date.now();
    
    // Mark phase: mark all reachable objects
    this.markPhase();
    
    // Sweep phase: deallocate unmarked objects
    this.sweepPhase();
    
    const endTime = Date.now();
    this.totalGcTime += endTime - startTime;
    this.gcRuns++;
    this.allocationCount = 0; // Reset allocation counter
  }

  /**
   * Mark phase of garbage collection
   */
  private markPhase(): void {
    // Clear all marks
    for (const block of this.memory) {
      if (block) {
        block.marked = false;
      }
    }

    // Mark from roots
    for (const rootAddress of Array.from(this.roots)) {
      this.markReachable(rootAddress);
    }

    // Mark objects with positive reference counts
    for (const block of this.memory) {
      if (block && block.allocated && block.refCount > 0) {
        this.markReachable(block.address);
      }
    }
  }

  /**
   * Mark an object and its references as reachable
   */
  private markReachable(address: number): void {
    const block = this.memory[address];
    if (!block || !block.allocated || block.marked) {
      return;
    }

    block.marked = true;

    // Mark referenced objects (simplified - in a real implementation,
    // we'd traverse object properties and array elements)
    if (block.type === 'object' && typeof block.data === 'object') {
      for (const value of Object.values(block.data)) {
        if (typeof value === 'number' && this.memory[value]) {
          this.markReachable(value);
        }
      }
    }
  }

  /**
   * Sweep phase of garbage collection
   */
  private sweepPhase(): void {
    for (let i = 0; i < this.memory.length; i++) {
      const block = this.memory[i];
      if (block && block.allocated && !block.marked) {
        this.deallocate(i);
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    let usedMemory = 0;
    let allocatedBlocks = 0;

    for (const block of this.memory) {
      if (block && block.allocated) {
        usedMemory += block.size;
        allocatedBlocks++;
      }
    }

    return {
      totalMemory: this.maxMemory,
      usedMemory,
      freeMemory: this.maxMemory - usedMemory,
      allocatedBlocks,
      freeBlocks: this.freeList.length,
      gcRuns: this.gcRuns,
      gcTime: this.totalGcTime
    };
  }

  /**
   * Get used memory size
   */
  private getUsedMemory(): number {
    let used = 0;
    for (const block of this.memory) {
      if (block && block.allocated) {
        used += block.size;
      }
    }
    return used;
  }

  /**
   * Force garbage collection
   */
  forceGC(): void {
    this.garbageCollect();
  }

  /**
   * Set GC threshold
   */
  setGCThreshold(threshold: number): void {
    this.gcThreshold = threshold;
  }

  /**
   * Get memory fragmentation ratio
   */
  getFragmentation(): number {
    const stats = this.getStats();
    if (stats.allocatedBlocks === 0) return 0;
    return stats.freeBlocks / (stats.allocatedBlocks + stats.freeBlocks);
  }

  /**
   * Compact memory (defragmentation)
   */
  compact(): void {
    const compactedMemory: MemoryBlock[] = [];
    const addressMapping = new Map<number, number>();
    let newAddress = 0;

    // Copy allocated blocks to new memory layout
    for (let i = 0; i < this.memory.length; i++) {
      const block = this.memory[i];
      if (block && block.allocated) {
        const newBlock = { ...block, address: newAddress };
        compactedMemory[newAddress] = newBlock;
        addressMapping.set(i, newAddress);
        newAddress++;
      }
    }

    // Update references in compacted memory
    for (const block of compactedMemory) {
      if (block && block.type === 'object' && typeof block.data === 'object') {
        for (const [key, value] of Object.entries(block.data)) {
          if (typeof value === 'number' && addressMapping.has(value)) {
            block.data[key] = addressMapping.get(value);
          }
        }
      }
    }

    // Update roots
    const newRoots = new Set<number>();
    for (const rootAddress of Array.from(this.roots)) {
      const newAddr = addressMapping.get(rootAddress);
      if (newAddr !== undefined) {
        newRoots.add(newAddr);
      }
    }

    // Replace memory and update state
    this.memory = compactedMemory;
    this.roots = newRoots;
    this.nextAddress = newAddress;
    this.freeList = [];
  }

  /**
   * Reset memory manager
   */
  reset(): void {
    this.memory = [];
    this.freeList = [];
    this.roots.clear();
    this.nextAddress = 0;
    this.allocationCount = 0;
    this.gcRuns = 0;
    this.totalGcTime = 0;
  }

  /**
   * Debug: dump memory state
   */
  dumpMemory(): void {
    console.log('Memory Dump:');
    console.log('='.repeat(40));
    
    for (let i = 0; i < this.memory.length; i++) {
      const block = this.memory[i];
      if (block) {
        console.log(`[${i}] ${block.allocated ? 'ALLOC' : 'FREE'} ${block.type} size:${block.size} refs:${block.refCount} data:${JSON.stringify(block.data)}`);
      }
    }
    
    console.log(`Free list: [${this.freeList.join(', ')}]`);
    console.log(`Roots: [${Array.from(this.roots).join(', ')}]`);
    console.log(`Stats:`, this.getStats());
  }
}