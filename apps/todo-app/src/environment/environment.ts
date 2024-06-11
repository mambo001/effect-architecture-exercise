import { Config, ConfigProvider, Context, Effect } from 'effect';
import { NodeServer } from 'effect-http-node';
import { Middlewares, RouterBuilder, HttpError } from 'effect-http';

import { ApiRoutes } from '../api/api';
import {
  listTodos,
  ShortUniqueIdGeneratorLive,
  TimestampGeneratorLive,
  lookupUser,
  listUsers,
} from '../services/services';
import { someOrFail } from '../lib/common';
import {
  handleAssignTodoCommand,
  handleCreateTodoCommand,
  handleCreateUserCommand,
  handleGetTodoByIdQueryHandler,
  handleMarkDoneTodoCommand,
} from '../use-cases/use-cases';
import {
  PgLive,
  SqlTodoPersistence,
  SqlTodoStatusRepository,
  SqlUserPersistence,
} from '../infra';
import { User } from '../core';

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
    handleCreateTodoCommand({ title: body.title }).pipe(
      Effect.map((todo) => ({
        message: 'Todo created',
        todo,
      }))
    )
  ),
  RouterBuilder.handle('lookupTodo', ({ path }) =>
    handleGetTodoByIdQueryHandler({
      todoId: path.todoId,
    }).pipe(
      Effect.catchTag('NoSuchElementException', () =>
        Effect.fail(HttpError.notFoundError())
      ),
      Effect.map((assignedTodo) => ({ todo: assignedTodo }))
    )
  ),
  RouterBuilder.handle('listTodo', () =>
    listTodos.pipe(Effect.map((todos) => ({ todos })))
  ),
  RouterBuilder.handle('markDoneTodo', ({ body }) =>
    handleMarkDoneTodoCommand({ todoId: body.todoId, userId: body.userId })
  ),
  RouterBuilder.handle('createUser', ({ body }) =>
    handleCreateUserCommand({
      name: body.name,
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
    handleAssignTodoCommand({
      todoId: body.todoId,
      userId: body.userId,
    })
  ),
  RouterBuilder.build
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
