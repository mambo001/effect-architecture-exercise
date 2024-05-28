import { Config, ConfigProvider, Context, Effect, flow, pipe } from 'effect';
import { NodeServer } from 'effect-http-node';
import { ApiGroup, Middlewares, RouterBuilder } from 'effect-http';

import { ApiRouteBuilder, ApiRoutes, getTodo, getUser } from '../api';
import { handleListTodosQuery } from '../lib/queries';
import { Todo } from '../lib/domain/todo';

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

// const handleTodoEndpoints = ApiGroup.make('Todo Group').pipe(
//   ApiGroup.addEndpoint(getUser)
// );
export function handleTodoEndpoints<R, E>(builder: ApiRouteBuilder<R, E>) {
  return builder.pipe(
    RouterBuilder.handle('listTodo', () =>
      handleListTodosQuery().pipe(
        Effect.map((todos) => ({
          todos: todos.map(
            (todo) =>
              new Todo({
                id: todo.id,
                title: todo.title,
              })
          ),
        }))
      )
    )
  );
}

const handleUserEndpoints = ApiGroup.make('User Group').pipe(
  ApiGroup.addEndpoint(getTodo)
);

const handleEndpoints = flow(handleTodoEndpoints, handleUserEndpoints);

const ApiApp = ApiRoutes.pipe(
  RouterBuilder.make,
  handleEndpoints,
  RouterBuilder.build
);

const runApi = AppConfig.pipe(
  Effect.flatMap((config) =>
    ApiApp.pipe(
      Middlewares.cors({
        allowedOrigins: [config.allowedOrigins],
      }),
      Middlewares.errorLog,
      //     consoleRequestLogger,
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
        Effect.provideService(AppConfig, config)
      )
    )
  );
