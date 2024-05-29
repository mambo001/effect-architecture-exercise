import { Config, ConfigProvider, Context, Effect } from 'effect';
import { NodeServer } from 'effect-http-node';
import { Middlewares, RouterBuilder, HttpError } from 'effect-http';

import { ApiRoutes } from '../api';
import { Todo, User } from '../model';
import {
  lookupTodo,
  listTodos,
  StubTodoPersistence,
  saveTodo,
  ShortUniqueIdGeneratorLive,
  TimestampGeneratorLive,
  generateId,
  generateTimestamp,
  StubUserPersistence,
  saveUser,
  lookupUser,
  listUsers,
} from '../services';
import { someOrFail } from '../lib/common';

const appConfig = Config.all({
  port: Config.number('PORT').pipe(Config.withDefault(3000)),
  allowedOrigins: Config.string('ALLOWED_ORIGINS').pipe(
    Config.withDefault('*')
  ),
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
      const todo = yield* _(
        lookupTodo(body.todoId).pipe(
          someOrFail(() =>
            HttpError.notFoundError({
              message: 'Todo not found',
            })
          )
        )
      );
      const updatedTodo = new Todo({
        ...todo,
        isDone: true,
      });
      yield* _(saveTodo(updatedTodo));
      return {
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
        assignedTodos: [],
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
      const todo = yield* _(
        lookupTodo(body.todoId).pipe(
          someOrFail(() =>
            HttpError.notFoundError({
              message: 'Todo not found',
            })
          )
        )
      );
      const user = yield* _(
        lookupUser(body.userId).pipe(
          someOrFail(() =>
            HttpError.notFoundError({
              message: 'User not found',
            })
          )
        )
      );
      yield* _(
        saveTodo(
          new Todo({
            ...todo,
            isDone: true,
          })
        )
      );
      yield* _(
        saveUser(
          new User({
            ...user,
            assignedTodos: [...user.assignedTodos, todo.id],
          })
        )
      );
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
        Effect.provide(
          StubTodoPersistence({
            '1': {
              id: '1',
              timestamp: new Date(),
              title: 'First todo',
              isDone: false,
            },
            '2': {
              id: '2',
              timestamp: new Date(),
              title: 'Second todo',
              isDone: false,
            },
            '3': {
              id: '3',
              timestamp: new Date(),
              title: 'Third todo',
              isDone: false,
            },
          })
        ),
        Effect.provide(
          StubUserPersistence({
            '1': {
              id: '1',
              name: 'User 1',
              assignedTodos: [''],
            },
            '2': {
              id: '2',
              name: 'User 2',
              assignedTodos: [''],
            },
            '3': {
              id: '3',
              name: 'User 3',
              assignedTodos: [''],
            },
          })
        ),
        Effect.provide(ShortUniqueIdGeneratorLive),
        Effect.provide(TimestampGeneratorLive),
        Effect.provideService(AppConfig, config)
      )
    )
  );
