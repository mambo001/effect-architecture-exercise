import { Schema, ParseResult } from '@effect/schema';
import {
  Array,
  Console,
  Context,
  Data,
  Effect,
  Layer,
  Match,
  Option,
  pipe,
} from 'effect';
import * as Sql from '@effect/sql';
import { SqlError } from '@effect/sql/Error';
import { decodeTodoArray } from './services';
import { Todo } from './model';

export class TodoNotAssigned extends Schema.TaggedClass<TodoNotAssigned>()(
  'TodoNotAssigned',
  {
    id: Schema.String,
  }
) {}

export class TodoAssigned extends Schema.TaggedClass<TodoAssigned>()(
  'TodoAssigned',
  { id: Schema.String, userId: Schema.String }
) {}

export class TodoDone extends Schema.TaggedClass<TodoDone>()('TodoDone', {
  id: Schema.String,
  userId: Schema.String,
}) {}

export class TodoStatusError extends Data.TaggedError('TodoStatusError')<{
  raw: unknown;
}> {}

export type TodoStatus = TodoNotAssigned | TodoAssigned | TodoDone;
export const TodoStatus = Schema.Union(TodoNotAssigned, TodoAssigned, TodoDone);
export const encodeTodoStatus = Schema.encode(TodoStatus);
export const decodeTodoStatusArray = Schema.decodeUnknown(
  Schema.Array(TodoStatus)
);

export interface DBRow {
  assignedTo: string;
  isAssigned: boolean;
}

export const DBRow = Schema.Struct({
  assignedTo: Schema.String,
  isAssigned: Schema.Boolean,
});

export function makeDBRow(todoStatus: TodoStatus): DBRow {
  switch (todoStatus._tag) {
    case 'TodoNotAssigned':
      return { assignedTo: '', isAssigned: false };
    case 'TodoAssigned':
      return { assignedTo: todoStatus.userId, isAssigned: true };
    case 'TodoDone':
      return { assignedTo: todoStatus.userId, isAssigned: true };
  }
}

const matchTodoStatus = Match.typeTags<TodoStatus>();

export function assignTodo(todoStatus: TodoStatus, userId: string) {
  return matchTodoStatus({
    TodoNotAssigned: ({ id }) => {
      // assign todo
      return Effect.succeed(new TodoAssigned({ id, userId }));
    },
    TodoAssigned: (err) => {
      return Effect.fail(new TodoStatusError({ raw: err }));
    },
    TodoDone: (err) => {
      return Effect.fail(new TodoStatusError({ raw: err }));
    },
  })(todoStatus);
}

export function markDoneTodo(todoStatus: TodoStatus, userId: string) {
  return matchTodoStatus({
    TodoNotAssigned: ({ id }) => {
      // assign todo
      return Effect.succeed(todoStatus);
    },
    TodoAssigned: ({ id }) => {
      // todo already assigned
      return Effect.succeed(new TodoDone({ id, userId }));
    },
    TodoDone: ({ userId }) => {
      // todo is done
      return Effect.succeed(todoStatus);
    },
  })(todoStatus);
}

export class TodoStatusRepositoryError extends Data.TaggedError(
  'TodoStatusRepositoryError'
)<{
  raw: unknown;
}> {}

export interface TodoStatusRepository {
  save: (
    todo: TodoStatus
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | TodoStatusRepositoryError | SqlError
  >;
  lookup: (
    todoId: string
  ) => Effect.Effect<
    Option.Option<TodoStatus>,
    ParseResult.ParseError | TodoStatusRepositoryError | SqlError
  >;
}
export const TodoStatusRepository =
  Context.GenericTag<TodoStatusRepository>('todo-status');

function makeTodoStatus(todo: Todo): TodoStatus {
  if (!todo.assignedTo || todo.assignedTo === null) {
    return new TodoNotAssigned({ id: todo.id });
  }
  if (!todo.isDone) {
    return new TodoAssigned({
      id: todo.id,
      userId: todo.assignedTo,
    });
  }
  return new TodoDone({ id: todo.id, userId: todo.assignedTo });
}

export const SqlTodoStatusRepository = Sql.client.Client.pipe(
  Effect.map(
    (client): TodoStatusRepository => ({
      save: (todoStatus) =>
        Effect.gen(function* (_) {
          const row = makeDBRow(todoStatus);
          yield* _(
            client`
              UPDATE todos
              SET assigned_to = ${row.assignedTo}
              WHERE todos.id = ${todoStatus.id}
            `
          );
          yield* _(Effect.log(`${todoStatus.id} is saved!`));
        }),
      lookup: (userId) =>
        Effect.gen(function* (_) {
          const raw = yield* _(
            client`
                SELECT *
                FROM todos
                WHERE todos.id = ${userId}
              `
          );
          const todos = yield* _(decodeTodoArray(raw));
          return pipe(Array.head(todos), Option.map(makeTodoStatus));
        }),
    })
  ),
  Layer.effect(TodoStatusRepository)
);

export const { save: saveTodoStatus, lookup: lookupTodoStatus } =
  Effect.serviceFunctions(TodoStatusRepository);
