import { Config, ConfigProvider, Context, Effect } from 'effect';
import { NodeServer } from 'effect-http-node';
import { Middlewares, RouterBuilder, HttpError } from 'effect-http';

import { ApiRoutes, markDoneTodo } from '../api';
import { Todo } from '../model';
import {
  lookupTodo,
  listTodos,
  StubTodoPersistence,
  saveTodo,
  ShortUniqueIdGeneratorLive,
  TimestampGeneratorLive,
  generateId,
  generateTimestamp,
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
        id,
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
        Effect.provide(ShortUniqueIdGeneratorLive),
        Effect.provide(TimestampGeneratorLive),
        Effect.provideService(AppConfig, config)
      )
    )
  );
