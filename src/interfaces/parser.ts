import { Token, Program } from '../types';

export interface Parser {
  parse(tokens: Token[]): Program;
}