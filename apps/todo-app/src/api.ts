import { flow, pipe } from 'effect';
import { Schema } from '@effect/schema';
import { Api, ApiGroup, RouterBuilder } from 'effect-http';

import { StatusCodes } from './lib/http';

export const UserResponse = Schema.Struct({
  name: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive()),
});
export const TodoResponse = Schema.Struct({
  title: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive()),
});

export const GetUserQuery = Schema.Struct({ id: Schema.NumberFromString });
export const PostUserQuery = Schema.Struct({ id: Schema.NumberFromString });
export const PutUserQuery = Schema.Struct({ id: Schema.NumberFromString });

export const GetTodoQuery = Schema.Struct({ id: Schema.NumberFromString });
export const PostTodoQuery = Schema.Struct({ id: Schema.NumberFromString });
export const PutTodoQuery = Schema.Struct({ id: Schema.NumberFromString });

export const ApiErrorResponse = Schema.Struct({
  message: Schema.String,
});
export const ApiAuthHeaders = Schema.Struct({
  authorization: Schema.String,
});

// add builder - eirene-ppe: backend/modules/api/tracker/maintenance-request
export const getUser = Api.get('getUser', '/user').pipe(
  Api.setResponseBody(UserResponse),
  Api.setResponseStatus(StatusCodes.OK),
  Api.setRequestQuery(GetUserQuery),
  Api.setRequestHeaders(ApiAuthHeaders)
);

export const getTodo = Api.get('getTodo', '/todo').pipe(
  Api.setResponseBody(TodoResponse),
  Api.setResponseStatus(StatusCodes.OK),
  Api.setRequestQuery(GetTodoQuery),
  Api.setRequestHeaders(ApiAuthHeaders)
);
export const listTodo = Api.get('listTodo', '/todos').pipe(
  Api.setResponseBody(TodoResponse),
  Api.setResponseStatus(StatusCodes.OK),
  Api.setRequestHeaders(ApiAuthHeaders)
);

const TodoGroup = ApiGroup.make('Todo Group').pipe(
  ApiGroup.addEndpoint(getTodo),
  ApiGroup.addEndpoint(listTodo)
);

const UserGroup = ApiGroup.make('User Group').pipe(
  ApiGroup.addEndpoint(getUser)
);

export const ApiRoutes = pipe(
  Api.make({ title: 'Todo App API' }),
  Api.addGroup(UserGroup),
  Api.addGroup(TodoGroup)
);

type Endpoints<A> = A extends Api.Api<infer Endpoints> ? Endpoints : never;

export type ApiRouteBuilder<R, E> = RouterBuilder.RouterBuilder<
  R,
  E,
  Endpoints<typeof ApiRoutes>
>;
