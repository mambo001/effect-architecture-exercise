import { Schema } from '@effect/schema';
import { Data, Effect, Match } from 'effect';

export class TodoNotAssigned extends Schema.TaggedClass<TodoNotAssigned>()(
  'TodoNotAssigned',
  {
    id: Schema.String,
  }
) {}

export class TodoAssigned extends Schema.TaggedClass<TodoAssigned>()(
  'TodoAssigned',
  { id: Schema.String, userId: Schema.String }
) {}

export class TodoDone extends Schema.TaggedClass<TodoDone>()('TodoDone', {
  id: Schema.String,
  userId: Schema.String,
}) {}

export class TodoStatusError extends Data.TaggedError('TodoStatusError')<{
  raw: unknown;
}> {}

export type TodoStatus = TodoNotAssigned | TodoAssigned | TodoDone;
export const TodoStatus = Schema.Union(TodoNotAssigned, TodoAssigned, TodoDone);
export const encodeTodoStatus = Schema.encode(TodoStatus);
export const decodeTodoStatusArray = Schema.decodeUnknown(
  Schema.Array(TodoStatus)
);

const matchTodoStatus = Match.typeTags<TodoStatus>();

export function assignTodo(todoStatus: TodoStatus, userId: string) {
  return matchTodoStatus({
    TodoNotAssigned: ({ id }) => {
      // assign todo
      return Effect.succeed(new TodoAssigned({ id, userId }));
    },
    TodoAssigned: (todoStatus) => {
      return Effect.fail(todoStatus);
    },
    TodoDone: (todoStatus) => {
      return Effect.fail(todoStatus);
    },
  })(todoStatus);
}

export function markDoneTodo(todoStatus: TodoStatus, userId: string) {
  return matchTodoStatus({
    TodoNotAssigned: (todoStatus) => {
      // assign todo
      return Effect.fail(todoStatus);
    },
    TodoAssigned: (todoStatus) => {
      if (todoStatus.userId !== userId) {
        return Effect.fail(todoStatus);
      }
      return Effect.succeed(new TodoDone({ id: todoStatus.id, userId }));
    },
    TodoDone: (todoStatus) => {
      return Effect.fail(todoStatus);
    },
  })(todoStatus);
}
