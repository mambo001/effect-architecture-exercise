import { Effect, Layer, Option, Array, Config, String } from 'effect';
import { Schema } from '@effect/schema';
import * as Sql from '@effect/sql';
import { PgClientConfig } from '@effect/sql-pg/Client';
import * as Pg from '@effect/sql-pg';

import {
  TodoAssigned,
  TodoDone,
  TodoNotAssigned,
  TodoStatus,
} from '../core/todo-status';
import { Todo, User } from '../core';
import {
  TodoPersistence,
  TodoStatusRepository,
  UserPersistence,
} from '../services/services';

export function makeDBRow(todoStatus: TodoStatus): DBRow {
  switch (todoStatus._tag) {
    case 'TodoNotAssigned':
      return { id: todoStatus.id, assignedTo: '', isDone: false };
    case 'TodoAssigned':
      return {
        id: todoStatus.id,
        assignedTo: todoStatus.userId,
        isDone: false,
      };
    case 'TodoDone':
      return { id: todoStatus.id, assignedTo: todoStatus.userId, isDone: true };
  }
}

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

export type DBRow = Schema.Schema.Type<typeof DBRow>;

export const DBRow = Schema.Struct({
  id: Schema.String,
  assignedTo: Schema.NullOr(Schema.String),
  isDone: Schema.Boolean,
});

function makeTodoStatus(todo: DBRow): TodoStatus {
  if (!todo.assignedTo || todo.assignedTo === null) {
    return new TodoNotAssigned({ id: todo.id });
  }
  if (!todo.isDone) {
    return new TodoAssigned({
      id: todo.id,
      userId: todo.assignedTo,
    });
  }
  return new TodoDone({ id: todo.id, userId: todo.assignedTo });
}

export const decodeDBRowArray = Schema.decodeUnknown(Schema.Array(DBRow));
export const SqlTodoStatusRepository = Sql.client.Client.pipe(
  Effect.map(
    (client): TodoStatusRepository => ({
      save: (todoStatus) =>
        Effect.gen(function* (_) {
          const row = makeDBRow(todoStatus);
          yield* _(
            client`
                UPDATE todos
                SET assigned_to = ${row.assignedTo},
                is_done = ${row.isDone}
                WHERE todos.id = ${todoStatus.id}
              `
          );
          yield* _(Effect.log(`${todoStatus.id} is saved!`));
        }),
      lookup: (todoId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client`
                  SELECT
                    id,
                    is_done,
                    assigned_to
                  FROM todos
                  WHERE todos.id = ${todoId}
                `
          );
          const todos = yield* _(decodeDBRowArray(raw));
          return Array.head(todos).pipe(Option.map(makeTodoStatus));
        }),
    })
  ),
  Layer.effect(TodoStatusRepository)
);

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
