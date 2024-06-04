import { Config, Context, Data, Effect, Layer, Option, pipe } from 'effect';
import * as Sql from '@effect/sql';
import * as Pg from '@effect/sql-pg';
import ShortUniqueId from 'short-unique-id';

import { ParseResult } from '@effect/schema';

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
  });

export const SqlUserPersistence = Sql.client.Client.pipe(
  Effect.map(
    (client): UserPersistence => ({
      save: (user) =>
        Effect.gen(function* (_) {
          const res = yield* _(
            client`INSERT INTO
              users (
                id, 
                name, 
                assigned_todos
              )
              VALUES (
                ${user.id}, 
                ${user.name}, 
                ARRAY[${user.assignedTodos.join("','")}]
              )
            `
          );
          yield* _(Effect.log(res));
          yield* _(Effect.log(`${user.id} is saved!`));
        }),
      lookup: (userId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client<{
              readonly id: string;
              readonly name: string;
              readonly assigned_todos: string[];
            }>`SELECT *
            FROM users
            WHERE users.id = ${String(userId)}
            `
          );
          return yield* _(
            Effect.succeed(
              pipe(
                raw,
                Option.fromIterable,
                Option.map(
                  (user) =>
                    new User({
                      id: user.id,
                      name: user.name,
                      assignedTodos: user.assigned_todos,
                    })
                )
              )
            )
          );
        }),
      list: Effect.gen(function* (_) {
        const raw = yield* _(
          client<{
            readonly id: string;
            readonly name: string;
            readonly assigned_todos: string[];
          }>`
          SELECT *
          FROM users
          `
        );
        return raw.map(
          (user) =>
            new User({
              id: user.id,
              name: user.name,
              assignedTodos: user.assigned_todos,
            })
        );
      }),
    })
  ),
  Layer.effect(UserPersistence)
);

export const SqlTodoPersistence = Sql.client.Client.pipe(
  Effect.map(
    (client): TodoPersistence => ({
      save: (todo) =>
        Effect.gen(function* (_) {
          const res = yield* _(
            client`INSERT INTO
              todos (
                id, 
                timestamp,
                title,
                is_done
              )
              VALUES (
                ${todo.id}, 
                ${todo.timestamp},
                ${todo.title}, 
                ${todo.isDone}
              )
            `
          );
          yield* _(Effect.log(res));
          yield* _(Effect.log(`${todo.id} is saved!`));
        }),
      lookup: (todoId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client<{
              readonly id: string;
              readonly timestamp: Date;
              readonly title: string;
              readonly is_done: boolean;
            }>`SELECT *
            FROM todos
            WHERE todos.id = ${String(todoId)}
            `
          );
          return yield* _(
            Effect.succeed(
              pipe(
                raw,
                Option.fromIterable,
                Option.map(
                  (todo) =>
                    new Todo({
                      id: todo.id,
                      timestamp: todo.timestamp,
                      title: todo.title,
                      isDone: todo.is_done,
                    })
                )
              )
            )
          );
        }),
      list: Effect.gen(function* (_) {
        const raw = yield* _(
          client<{
            readonly id: string;
            readonly timestamp: Date;
            readonly title: string;
            readonly is_done: boolean;
          }>`
          SELECT *
          FROM todos
          `
        );
        return raw.map(
          (todo) =>
            new Todo({
              id: todo.id,
              timestamp: todo.timestamp,
              title: todo.title,
              isDone: todo.is_done,
            })
        );
      }),
    })
  ),
  Layer.effect(TodoPersistence)
);
