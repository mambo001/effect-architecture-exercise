// TODO: define todo, user schemas
import { Data } from 'effect';
import { Schema } from '@effect/schema';

export class Todo extends Data.Class<{
  id: string;
  timestamp: Date;
  title: string;
  isDone: boolean;
}> {}

export const TodoSchema = Schema.Struct({
  id: Schema.String,
  timestamp: Schema.DateFromString,
  title: Schema.String,
  isDone: Schema.Boolean,
});

export const CreateTodo = Schema.Struct({
  title: Schema.String,
});

export const CreateTodoResponse = Schema.Struct({
  message: Schema.String,
  todo: TodoSchema,
});

export const LookupTodoResponse = Schema.Struct({
  todo: TodoSchema,
});

export const LookupTodoRequestPath = Schema.Struct({ todoId: Schema.String });

export const LookupTodoRequestBody = Schema.Struct({ todo: TodoSchema });

export const ListTodoResponse = Schema.Struct({
  todos: Schema.Array(TodoSchema),
});

export const MarkTodoDoneResponse = Schema.Struct({
  message: Schema.String,
});

export const MarkTodoDoneRequestPath = Schema.Struct({
  todoId: Schema.String,
});
