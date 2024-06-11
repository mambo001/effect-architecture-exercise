import { Context, Data, Effect, Layer, Option } from 'effect';
import ShortUniqueId from 'short-unique-id';
import { ParseResult } from '@effect/schema';
import { SqlError } from '@effect/sql/Error';

import { Todo, TodoStatus, User } from '../core';

export class TodoPersistenceError extends Data.TaggedError(
  'TodoPersistenceError'
)<{
  raw: unknown;
}> {}

export interface TodoPersistence {
  save: (
    todo: Todo
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | TodoPersistenceError | SqlError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    todoId: string | number
  ) => Effect.Effect<
    Option.Option<Todo>,
    ParseResult.ParseError | TodoPersistenceError | SqlError
  >;
  list: Effect.Effect<
    ReadonlyArray<Todo>,
    ParseResult.ParseError | TodoPersistenceError | SqlError
  >;
}

export const TodoPersistence = Context.GenericTag<TodoPersistence>('todo');

export const { save: saveTodo, lookup: lookupTodo } =
  Effect.serviceFunctions(TodoPersistence);
export const { list: listTodos } = Effect.serviceConstants(TodoPersistence);

export class UserPersistenceError extends Data.TaggedError(
  'UserPersistenceError'
)<{
  raw: unknown;
}> {}

export interface UserPersistence {
  save: (
    user: User
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | UserPersistenceError | SqlError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    userId: string | number
  ) => Effect.Effect<
    Option.Option<User>,
    ParseResult.ParseError | UserPersistenceError | SqlError
  >;
  list: Effect.Effect<
    ReadonlyArray<User>,
    ParseResult.ParseError | UserPersistenceError | SqlError
  >;
}

export const UserPersistence = Context.GenericTag<UserPersistence>('user');

export const { save: saveUser, lookup: lookupUser } =
  Effect.serviceFunctions(UserPersistence);
export const { list: listUsers } = Effect.serviceConstants(UserPersistence);

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

function makeId(): IdGenerator {
  const id = new ShortUniqueId({ length: 6 });
  return {
    generate: Effect.sync(() => id.randomUUID(10)),
  };
}

export const ShortUniqueIdGeneratorLive = Layer.sync(IdGenerator, makeId);

export const TimestampGenerator = Context.GenericTag<TimestampGenerator>(
  'core/services/timestamp-generator'
);

export const { generate: generateTimestamp } =
  Effect.serviceConstants(TimestampGenerator);

export function makeTimestamp(): TimestampGenerator {
  return {
    generate: Effect.sync(() => new Date()),
  };
}

export const TimestampGeneratorLive = Layer.sync(
  TimestampGenerator,
  makeTimestamp
);

export class TodoStatusRepositoryError extends Data.TaggedError(
  'TodoStatusRepositoryError'
)<{
  raw: unknown;
}> {}

export interface TodoStatusRepository {
  save: (
    todo: TodoStatus
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | TodoStatusRepositoryError | SqlError
  >;
  lookup: (
    todoId: string
  ) => Effect.Effect<
    Option.Option<TodoStatus>,
    ParseResult.ParseError | TodoStatusRepositoryError | SqlError
  >;
}
export const TodoStatusRepository =
  Context.GenericTag<TodoStatusRepository>('todo-status');

export const { save: saveTodoStatus, lookup: lookupTodoStatus } =
  Effect.serviceFunctions(TodoStatusRepository);
