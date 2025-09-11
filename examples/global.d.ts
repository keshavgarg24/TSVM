/**
 * Global type definitions for TypeScript VM built-in functions
 * This file provides type definitions for the custom language built-ins
 */

declare function print(value: any): void;
declare function abs(x: number): number;
declare function sqrt(x: number): number;
declare function pow(x: number, y: number): number;
declare function length(str: string): number;
declare function substring(str: string, start: number, end: number): string;
declare function concat(str1: string, str2: string): string;
declare function toString(value: any): string;
declare function toNumber(value: any): number;
declare function toBoolean(value: any): boolean;