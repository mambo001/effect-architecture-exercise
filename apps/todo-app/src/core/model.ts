import { Schema } from '@effect/schema';

export class Todo extends Schema.Class<Todo>('Todo')({
  id: Schema.String,
  timestamp: Schema.Date,
  title: Schema.String,
  isDone: Schema.Boolean,
  assignedTo: Schema.NullOr(Schema.String),
}) {}

export class User extends Schema.Class<User>('User')({
  id: Schema.String,
  name: Schema.String,
}) {}
