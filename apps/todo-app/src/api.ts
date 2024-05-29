import { pipe } from 'effect';
import { Schema } from '@effect/schema';
import { Api, ApiGroup } from 'effect-http';

import { StatusCodes } from './lib/http';

export const Todo = Schema.Struct({
  id: Schema.String,
  timestamp: Schema.DateFromString,
  title: Schema.String,
});

export const LookupTodoPath = Schema.Struct({ todoId: Schema.String });
export const LookupTodoQuery = Schema.Struct({ todoId: Schema.String });
export const LookupTodoResponse = Schema.Struct({ todo: Todo });
export const lookupTodo = Api.get('lookupTodo', '/todos/:todoId').pipe(
  Api.setRequestPath(LookupTodoPath),
  Api.setResponseBody(LookupTodoResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

export const ListTodoResponse = Schema.Struct({ todos: Schema.Array(Todo) });
export const listTodo = Api.get('listTodo', '/todos').pipe(
  Api.setResponseBody(ListTodoResponse),
  Api.setResponseStatus(StatusCodes.OK)
);

const TodoGroup = ApiGroup.make('Todo Group').pipe(
  ApiGroup.addEndpoint(lookupTodo),
  ApiGroup.addEndpoint(listTodo)
);

export const ApiRoutes = pipe(
  Api.make({ title: 'Todo App API' }),
  Api.addGroup(TodoGroup)
);
