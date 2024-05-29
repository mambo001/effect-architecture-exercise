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
  MarkTodoDoneRequestPath,
  MarkTodoDoneResponse,
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
  Api.setResponseStatus(StatusCodes.OK),
  Api.addResponse({
    status: StatusCodes.NOT_FOUND,
    body: Schema.Struct({
      message: Schema.String,
    }),
  })
);

export const listTodo = Api.get('listTodo', '/todos').pipe(
  Api.setResponseBody(ListTodoResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

export const markDoneTodo = Api.put('markDoneTodo', '/todo/done').pipe(
  Api.setRequestBody(MarkTodoDoneRequestPath),
  Api.setResponseStatus(StatusCodes.OK),
  Api.setResponseBody(MarkTodoDoneResponse),
  Api.addResponse({
    status: StatusCodes.NOT_FOUND,
    body: Schema.Struct({
      message: Schema.String,
    }),
  }),
  Api.addResponse({
    status: StatusCodes.CONFLICT,
    body: Schema.Struct({
      message: Schema.String,
    }),
  })
);

const TodoGroup = ApiGroup.make('Todo Group').pipe(
  ApiGroup.addEndpoint(lookupTodo),
  ApiGroup.addEndpoint(listTodo),
  ApiGroup.addEndpoint(createTodo),
  ApiGroup.addEndpoint(markDoneTodo)
);

export const ApiRoutes = pipe(
  Api.make({ title: 'Todo App API' }),
  Api.addGroup(TodoGroup)
);
