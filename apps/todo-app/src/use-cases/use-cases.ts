import { Array, Effect, Option } from 'effect';
import { Schema } from '@effect/schema';
import * as Sql from '@effect/sql';

import {
  generateId,
  generateTimestamp,
  lookupTodoStatus,
  saveTodo,
  saveTodoStatus,
  saveUser,
} from '../services/services';
import { assignTodo, markDoneTodo } from '../core/todo-status';
import { someOrFail } from '../lib/common';
import { HttpError } from 'effect-http';
import { Todo, User } from '../core';

export interface CreateTodoCommand {
  title: string;
}

export function handleCreateTodoCommand(command: CreateTodoCommand) {
  return Effect.gen(function* (_) {
    const id = yield* _(generateId);
    const timestamp = yield* _(generateTimestamp);
    const todo = new Todo({
      id: `todo-${id}`,
      timestamp,
      title: command.title,
      isDone: false,
      assignedTo: '',
    });
    yield* _(saveTodo(todo));
    return todo;
  });
}

export interface MarkDoneTodoCommand {
  todoId: string;
  userId: string;
}

export function handleMarkDoneTodoCommand(command: MarkDoneTodoCommand) {
  return Effect.gen(function* (_) {
    const todoStatus = yield* _(
      lookupTodoStatus(command.todoId).pipe(
        someOrFail(() =>
          HttpError.notFoundError({
            message: 'Todo status not found',
          })
        )
      ),
      Effect.flatMap((todoStatus) => markDoneTodo(todoStatus, command.userId))
    );
    yield* _(saveTodoStatus(todoStatus));
    return {
      todoStatus,
      message: 'Todo marked as done',
    };
  });
}

export interface CreateUserCommand {
  name: string;
}

export function handleCreateUserCommand(command: CreateUserCommand) {
  return Effect.gen(function* (_) {
    const id = yield* _(generateId);
    const user = new User({
      id: `user-${id}`,
      name: command.name,
    });
    yield* _(saveUser(user));
    return {
      user,
      message: 'User created',
    };
  });
}

export interface AssignTodoCommand {
  todoId: string;
  userId: string;
}

export function handleAssignTodoCommand(command: AssignTodoCommand) {
  return Effect.gen(function* (_) {
    const todoStatus = yield* _(
      lookupTodoStatus(command.todoId).pipe(
        someOrFail(() =>
          HttpError.notFoundError({
            message: 'Todo not found',
          })
        )
      ),
      Effect.flatMap((todo) => assignTodo(todo, command.userId))
    );
    yield* _(saveTodoStatus(todoStatus));
    return {
      message: 'Todo assigned to user',
    };
  });
}

export interface GetTodoByIdQueryHandler {
  todoId: string;
}

export class AssignedTodo extends Schema.Class<AssignedTodo>('AssignedTodo')({
  todoId: Schema.String,
  timestamp: Schema.Date,
  title: Schema.String,
  isDone: Schema.Boolean,
  assignedToId: Schema.NullOr(Schema.String),
  assignedToName: Schema.NullOr(Schema.String),
}) {}

export const decodeAssignedTodoArray = Schema.decodeUnknown(
  Schema.Array(AssignedTodo)
);
export function handleGetTodoByIdQueryHandler(
  command: GetTodoByIdQueryHandler
) {
  return Effect.gen(function* (_) {
    const client = yield* _(Sql.client.Client);
    const raw = yield* _(
      client`
        SELECT 
            t.id AS todo_id,
            t.timestamp,
            t.title,
            t.is_done,
            t.assigned_to AS assigned_to_id,
            u.name AS assigned_to_name
        FROM todos t
        JOIN users u
            ON u.id = t.assigned_to
        WHERE
            t.id = ${command.todoId};
      `
    );
    const assignedTodo = yield* _(decodeAssignedTodoArray(raw));
    return yield* _(Array.head(assignedTodo));
  });
}
