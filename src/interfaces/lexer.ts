import { Token } from '../types';

export interface Lexer {
  tokenize(source: string): Token[];
}