import { pipe } from 'effect';
import { Schema } from '@effect/schema';
import { Api, ApiGroup } from 'effect-http';

import { StatusCodes } from './lib/http';
import {
  AssignTodoPath,
  AssignTodoResponse,
  CreateTodo,
  CreateTodoResponse,
  CreateUserRequest,
  CreateUserResponse,
  ListTodoResponse,
  ListUsersResponse,
  LookupTodoRequestPath,
  LookupTodoResponse,
  LookupUserPath,
  LookupUserResponse,
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

export const createUser = Api.post('createUser', '/users').pipe(
  Api.setRequestBody(CreateUserRequest),
  Api.setResponseStatus(StatusCodes.CREATED),
  Api.setResponseBody(CreateUserResponse),
  Api.addResponse({
    status: StatusCodes.CONFLICT,
    body: Schema.Struct({
      message: Schema.String,
    }),
  })
);

export const lookupUser = Api.get('lookupUser', '/users/:userId').pipe(
  Api.setRequestPath(LookupUserPath),
  Api.setResponseBody(LookupUserResponse),
  Api.setResponseStatus(StatusCodes.OK),
  Api.addResponse({
    status: StatusCodes.NOT_FOUND,
    body: Schema.Struct({
      message: Schema.String,
    }),
  })
);

export const listUsers = Api.get('listUsers', '/users').pipe(
  Api.setResponseBody(ListUsersResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

export const assignTodo = Api.put('assignTodo', '/todo/assignee').pipe(
  Api.setRequestBody(AssignTodoPath),
  Api.setResponseStatus(StatusCodes.NO_CONTENT),
  Api.setResponseBody(AssignTodoResponse),
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

const UserGroup = ApiGroup.make('User Group').pipe(
  ApiGroup.addEndpoint(createUser),
  ApiGroup.addEndpoint(lookupUser),
  ApiGroup.addEndpoint(listUsers),
  ApiGroup.addEndpoint(assignTodo)
);

export const ApiRoutes = pipe(
  Api.make({ title: 'Todo App API' }),
  Api.addGroup(TodoGroup),
  Api.addGroup(UserGroup)
);
