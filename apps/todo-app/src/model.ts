import { Schema } from '@effect/schema';

export class Todo extends Schema.Class<Todo>('Todo')({
  id: Schema.String,
  timestamp: Schema.Date,
  title: Schema.String,
  isDone: Schema.Boolean,
}) {}

export const CreateTodo = Schema.Struct({
  title: Schema.String,
});

export const CreateTodoResponse = Schema.Struct({
  message: Schema.String,
  todo: Todo,
});

export const LookupTodoResponse = Schema.Struct({
  todo: Todo,
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
  todoId: Schema.String,
});

export class User extends Schema.Class<User>('User')({
  id: Schema.String,
  name: Schema.String,
  assignedTodos: Schema.Array(Schema.String),
}) {}

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
