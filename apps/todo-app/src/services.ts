import {
  Config,
  Context,
  Data,
  Effect,
  Layer,
  Option,
  pipe,
  Array,
  String,
} from 'effect';
import * as Sql from '@effect/sql';
import * as Pg from '@effect/sql-pg';
import ShortUniqueId from 'short-unique-id';

import { ParseResult, Schema } from '@effect/schema';

import { Todo, User } from './model';
import { SqlError } from '@effect/sql/Error';
import { PgClientConfig } from '@effect/sql-pg/Client';

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

export type PgLiveConfig = Pick<
  PgClientConfig,
  'host' | 'database' | 'username' | 'password'
>;
export const PgLive = (config: PgLiveConfig) =>
  Pg.client.layer({
    host: Config.succeed(config.host),
    database: Config.succeed(config.database),
    username: Config.succeed(config.username),
    password: Config.succeed(config.password),
    transformQueryNames: Config.succeed(String.camelToSnake),
    transformResultNames: Config.succeed(String.snakeToCamel),
  });

export const encodeUser = Schema.encode(User);
export const decodeUserArray = Schema.decodeUnknown(Schema.Array(User));
export const SqlUserPersistence = Sql.client.Client.pipe(
  Effect.map(
    (client): UserPersistence => ({
      save: (user) =>
        Effect.gen(function* (_) {
          const encoded = yield* _(encodeUser(user));
          // TODO: add duplicate check here
          const res = yield* _(
            client`INSERT INTO
              users (
                id, 
                name
              )
              VALUES (
                ${encoded.id}, 
                ${encoded.name}
              )
            `
          );
          yield* _(Effect.log(res));
          yield* _(Effect.log(`${user.id} is saved!`));
        }),
      lookup: (userId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client`SELECT *
            FROM users
            WHERE users.id = ${userId}
            `
          );
          const user = yield* _(decodeUserArray(raw));
          return Array.head(user);
        }),
      list: Effect.gen(function* (_) {
        const raw = yield* _(
          client`
          SELECT *
          FROM users
          `
        );
        return yield* _(decodeUserArray(raw));
      }),
    })
  ),
  Layer.effect(UserPersistence)
);

export const encodeTodo = Schema.encode(Todo);
export const decodeTodoArray = Schema.decodeUnknown(Schema.Array(Todo));
export const SqlTodoPersistence = Sql.client.Client.pipe(
  Effect.map(
    (client): TodoPersistence => ({
      save: (todo) =>
        Effect.gen(function* (_) {
          const encoded = yield* _(encodeTodo(todo));
          const res = yield* _(
            client`INSERT INTO
              todos (
                id, 
                timestamp,
                title,
                is_done
              )
              VALUES (
                ${encoded.id}, 
                ${encoded.timestamp},
                ${encoded.title}, 
                ${encoded.isDone}
              )
              ON CONFLICT (id) DO UPDATE
              SET is_done = EXCLUDED.is_done
            `
          );
          yield* _(Effect.log(res));
          yield* _(Effect.log(`${encoded.id} is saved!`));
        }),
      lookup: (todoId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client`SELECT *
            FROM todos
            WHERE todos.id = ${todoId}
            `
          );
          const todo = yield* _(decodeTodoArray(raw));
          return Array.head(todo);
        }),
      list: Effect.gen(function* (_) {
        const raw = yield* _(
          client`
          SELECT *
          FROM todos
          `
        );
        return yield* _(decodeTodoArray(raw));
      }),
    })
  ),
  Layer.effect(TodoPersistence)
);
