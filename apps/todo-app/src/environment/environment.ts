import { Config, ConfigProvider, Context, Effect } from 'effect';
import { NodeServer } from 'effect-http-node';
import { Middlewares, RouterBuilder, HttpError } from 'effect-http';

import { ApiRoutes } from '../api';
import { Todo, User } from '../model';
import {
  lookupTodo,
  listTodos,
  saveTodo,
  ShortUniqueIdGeneratorLive,
  TimestampGeneratorLive,
  generateId,
  generateTimestamp,
  saveUser,
  lookupUser,
  listUsers,
  PgLive,
  SqlUserPersistence,
  SqlTodoPersistence,
} from '../services';
import { someOrFail } from '../lib/common';
import {
  SqlTodoStatusRepository,
  assignTodo,
  lookupTodoStatus,
  markDoneTodo,
  saveTodoStatus,
} from '../todo-status';

const appConfig = Config.all({
  port: Config.number('PORT').pipe(Config.withDefault(3000)),
  allowedOrigins: Config.string('ALLOWED_ORIGINS').pipe(
    Config.withDefault('*')
  ),
  database: Config.string('POSTGRES_DATABASE'),
  host: Config.string('HOST_IP'),
  username: Config.string('POSTGRES_USER'),
  password: Config.secret('POSTGRES_PASSWORD'),
});

type AppConfig_ = typeof appConfig extends Config.Config<infer A> ? A : never;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppConfig extends AppConfig_ {}

const AppConfig = Context.GenericTag<AppConfig>('app-config');

const ApiApp = ApiRoutes.pipe(
  RouterBuilder.make,
  RouterBuilder.handle('createTodo', ({ body }) =>
    Effect.gen(function* (_) {
      const id = yield* _(generateId);
      const timestamp = yield* _(generateTimestamp);
      const todo = new Todo({
        id: `todo-${id}`,
        timestamp,
        title: body.title,
        isDone: false,
        assignedTo: '',
      });
      yield* _(saveTodo(todo));
      return {
        todo,
        message: 'Todo created',
      };
    })
  ),
  RouterBuilder.handle('lookupTodo', ({ path }) =>
    lookupTodo(path.todoId).pipe(
      someOrFail(() =>
        HttpError.notFoundError({
          message: 'Todo not found',
        })
      ),
      Effect.map((todo) => ({ todo: new Todo(todo) }))
    )
  ),
  RouterBuilder.handle('listTodo', () =>
    listTodos.pipe(Effect.map((todos) => ({ todos })))
  ),
  RouterBuilder.handle('markDoneTodo', ({ body }) =>
    Effect.gen(function* (_) {
      const todoStatus = yield* _(
        lookupTodoStatus(body.todoId).pipe(
          someOrFail(() =>
            HttpError.notFoundError({
              message: 'Todo status not found',
            })
          )
        ),
        Effect.flatMap((todoStatus) => markDoneTodo(todoStatus, body.userId))
      );
      yield* _(saveTodoStatus(todoStatus));
      return {
        todoStatus,
        message: 'Todo marked as done',
      };
    })
  ),
  RouterBuilder.handle('createUser', ({ body }) =>
    Effect.gen(function* (_) {
      const id = yield* _(generateId);
      const user = new User({
        id: `user-${id}`,
        name: body.name,
      });
      yield* _(saveUser(user));
      return {
        user,
        message: 'User created',
      };
    })
  ),
  RouterBuilder.handle('lookupUser', ({ path }) =>
    lookupUser(path.userId).pipe(
      someOrFail(() =>
        HttpError.notFoundError({
          message: 'User not found',
        })
      ),
      Effect.map((user) => ({ user: new User(user) }))
    )
  ),
  RouterBuilder.handle('listUsers', () =>
    listUsers.pipe(Effect.map((users) => ({ users })))
  ),
  RouterBuilder.handle('assignTodo', ({ body }) =>
    Effect.gen(function* (_) {
      const todoStatus = yield* _(
        lookupTodoStatus(body.todoId).pipe(
          someOrFail(() =>
            HttpError.notFoundError({
              message: 'Todo not found',
            })
          )
        ),
        Effect.flatMap((todo) => assignTodo(todo, body.userId))
      );
      yield* _(saveTodoStatus(todoStatus));
      return {
        message: 'Todo assigned to user',
      };
    })
  ),
  RouterBuilder.buildPartial
);

const runApi = AppConfig.pipe(
  Effect.flatMap((config) =>
    ApiApp.pipe(
      Middlewares.cors({
        allowedOrigins: [config.allowedOrigins],
      }),
      Middlewares.errorLog,
      NodeServer.listen({ port: config.port })
    )
  )
);

const apps = [runApi];

export type Main = Effect.Effect<void, unknown, never>;

export const main: Main = ConfigProvider.fromEnv()
  .load(appConfig)
  .pipe(
    Effect.flatMap((config) =>
      Effect.all(apps, { concurrency: apps.length }).pipe(
        Effect.asVoid,
        Effect.provide(SqlTodoStatusRepository),
        Effect.provide(SqlTodoPersistence),
        Effect.provide(SqlUserPersistence),
        Effect.provide(
          PgLive({
            host: config.host,
            database: config.database,
            username: config.username,
            password: config.password,
          })
        ),
        Effect.provide(ShortUniqueIdGeneratorLive),
        Effect.provide(TimestampGeneratorLive),
        Effect.provideService(AppConfig, config)
      )
    )
  );
