import { pipe } from 'effect';
import { Schema } from '@effect/schema';
import { Api, ApiGroup } from 'effect-http';

import { StatusCodes } from './lib/http';
import {
  CreateTodo,
  CreateTodoResponse,
  ListTodoResponse,
  LookupTodoRequestPath,
  LookupTodoResponse,
} from './model';

export const createTodo = Api.post('createTodo', '/todos').pipe(
  Api.setRequestBody(CreateTodo),
  Api.setResponseStatus(StatusCodes.CREATED),
  Api.setResponseBody(CreateTodoResponse),
  Api.addResponse({
    status: StatusCodes.CONFLICT,
    body: Schema.Struct({
      message: Schema.String,
    }),
  })
);

export const lookupTodo = Api.get('lookupTodo', '/todos/:todoId').pipe(
  Api.setRequestPath(LookupTodoRequestPath),
  Api.setResponseBody(LookupTodoResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

export const listTodo = Api.get('listTodo', '/todos').pipe(
  Api.setResponseBody(ListTodoResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

const TodoGroup = ApiGroup.make('Todo Group').pipe(
  ApiGroup.addEndpoint(lookupTodo),
  ApiGroup.addEndpoint(listTodo),
  ApiGroup.addEndpoint(createTodo)
);

export const ApiRoutes = pipe(
  Api.make({ title: 'Todo App API' }),
  Api.addGroup(TodoGroup)
);
