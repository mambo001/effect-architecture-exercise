import { Match } from 'effect';
import { Schema } from '@effect/schema';

export class TodoSubmitted extends Schema.TaggedClass<TodoSubmitted>()(
  'CheckInSubmitted',
  {
    id: Schema.String,
    timestamp: Schema.DateFromString,
    title: Schema.String,
  }
) {}

export const TodoEvent = Schema.Union(TodoSubmitted);

export type TodoEvent = TodoSubmitted;

export const matchTodoEvent = Match.typeTags<TodoEvent>();
