import { Context, Data, Effect, Layer, Option } from 'effect';

import { ParseResult } from '@effect/schema';

import { Todo } from './model';

export class TodoPersistenceError extends Data.TaggedError(
  'TodoPersistenceTodoPersistenceError'
)<{
  raw: unknown;
}> {}

export interface TodoPersistence {
  save: (
    todo: Todo
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | TodoPersistenceError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    todoId: string | number
  ) => Effect.Effect<
    Option.Option<Todo>,
    ParseResult.ParseError | TodoPersistenceError
  >;
  list: Effect.Effect<
    ReadonlyArray<Todo>,
    ParseResult.ParseError | TodoPersistenceError
  >;
}

export const TodoPersistence = Context.GenericTag<TodoPersistence>('todo/repo');

export const { save: saveTodo, lookup: lookupTodo } =
  Effect.serviceFunctions(TodoPersistence);
export const { list: listTodos } = Effect.serviceConstants(TodoPersistence);

export interface IdGenerator {
  generate: Effect.Effect<string>;
}
export const IdGenerator = Context.GenericTag<IdGenerator>(
  'core/services/id-generator'
);
export const { generate: generateId } = Effect.serviceConstants(IdGenerator);
export interface TimestampGenerator {
  generate: Effect.Effect<Date>;
}

export const TimestampGenerator = Context.GenericTag<TimestampGenerator>(
  'core/services/timestamp-generator'
);
export const { generate: generateTimestamp } =
  Effect.serviceConstants(TimestampGenerator);

export const StubTodoPersistence = (todos: Record<string, Todo>) =>
  Layer.sync(TodoPersistence, () => ({
    save: (todo) =>
      Effect.succeed(() => {
        todos[todo.id] = todo;
      }),
    lookup: (todoId) =>
      Effect.succeed(Option.fromNullable(todos[String(todoId)])),
    list: Effect.succeed(Object.values(todos)),
  }));
