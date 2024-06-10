import { Config, ConfigProvider, Context, Effect } from 'effect';
import { NodeServer } from 'effect-http-node';
import { Middlewares, RouterBuilder, HttpError } from 'effect-http';

import { ApiRoutes } from '../api';
import { Todo, User } from '../model';
import {
  lookupTodo,
  listTodos,
  ShortUniqueIdGeneratorLive,
  TimestampGeneratorLive,
  lookupUser,
  listUsers,
  PgLive,
  SqlUserPersistence,
  SqlTodoPersistence,
} from '../services';
import { someOrFail } from '../lib/common';
import { SqlTodoStatusRepository } from '../todo-status';
import {
  handleAssignTodoCommand,
  handleCreateTodoCommand,
  handleCreateUserCommand,
  handleGetTodoByIdQueryHandler,
  handleMarkDoneTodoCommand,
} from '../use-cases';

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
    handleCreateTodoCommand({ title: body.title })
  ),
  RouterBuilder.handle('lookupTodo', ({ path }) =>
    handleGetTodoByIdQueryHandler({
      todoId: path.todoId,
    }).pipe(
      someOrFail(() => HttpError.notFoundError({ message: 'Todo not found' })),
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
