import { Context, Data, Effect, Layer, Option } from 'effect';
import ShortUniqueId from 'short-unique-id';

import { ParseResult } from '@effect/schema';

import { Todo, User } from './model';

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
    ParseResult.ParseError | UserPersistenceError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    userId: string | number
  ) => Effect.Effect<
    Option.Option<User>,
    ParseResult.ParseError | UserPersistenceError
  >;
  list: Effect.Effect<
    ReadonlyArray<User>,
    ParseResult.ParseError | UserPersistenceError
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

export const InMemoryTodoPersistence = (todos: Record<string, Todo>) =>
  Layer.sync(TodoPersistence, () => ({
    save: (todo) =>
      Effect.succeed(() => {
        todos[todo.id] = todo;
        return todo;
      }),
    lookup: (todoId) =>
      Effect.succeed(Option.fromNullable(todos[String(todoId)])),
    list: Effect.succeed(Object.values(todos)),
  }));

export const InMemoryUserPersistence = (users: Record<string, User>) =>
  Layer.sync(UserPersistence, () => ({
    save: (user) =>
      Effect.succeed(() => {
        users[user.id] = user;
        return user;
      }),
    lookup: (userId) =>
      Effect.succeed(Option.fromNullable(users[String(userId)])),
    list: Effect.succeed(Object.values(users)),
  }));
