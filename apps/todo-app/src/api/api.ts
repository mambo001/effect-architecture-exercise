import { pipe } from 'effect';
import { Schema } from '@effect/schema';
import { Api, ApiGroup } from 'effect-http';

import { StatusCodes } from '../lib/http';
import { Todo, User } from '../core';

export const CreateTodo = Schema.Struct({
  title: Schema.String,
});

export const CreateTodoResponse = Schema.Struct({
  message: Schema.String,
  todo: Todo,
});

export const LookupTodoResponse = Schema.Struct({
  todo: Schema.Struct({
    todoId: Schema.String,
    timestamp: Schema.Date,
    title: Schema.String,
    isDone: Schema.Boolean,
    assignedToId: Schema.NullOr(Schema.String),
    assignedToName: Schema.NullOr(Schema.String),
  }),
});

export const LookupTodoRequestPath = Schema.Struct({ todoId: Schema.String });

export const LookupTodoRequestBody = Schema.Struct({ todo: Todo });

export const ListTodoResponse = Schema.Struct({
  todos: Schema.Array(Todo),
});

export const MarkTodoDoneResponse = Schema.Struct({
  message: Schema.String,
});

export const MarkTodoDoneRequestPath = Schema.Struct({
  userId: Schema.String,
  todoId: Schema.String,
});

export const CreateUserRequest = Schema.Struct({ name: Schema.String });

export const CreateUserResponse = Schema.Struct({
  message: Schema.String,
  user: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
  }),
});

export const LookupUserPath = Schema.Struct({ userId: Schema.String });

export const LookupUserResponse = Schema.Struct({ user: User });

export const ListUsersResponse = Schema.Struct({
  users: Schema.Array(User),
});

export const AssignTodoPath = Schema.Struct({
  todoId: Schema.String,
  userId: Schema.String,
});

export const AssignTodoResponse = Schema.Struct({
  message: Schema.String,
});

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
