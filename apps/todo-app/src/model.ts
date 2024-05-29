// TODO: define todo, user schemas
import { Data } from 'effect';

export class Todo extends Data.Class<{
  id: string;
  timestamp: Date;
  title: string;
}> {}
