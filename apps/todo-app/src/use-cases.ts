import { Effect } from 'effect';

import { Todo, User } from './model';
import { generateId, generateTimestamp, saveTodo, saveUser } from './services';
import {
  assignTodo,
  lookupTodoStatus,
  markDoneTodo,
  saveTodoStatus,
} from './todo-status';
import { someOrFail } from './lib/common';
import { HttpError } from 'effect-http';

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
    return {
      todo,
      message: 'Todo created',
    };
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
