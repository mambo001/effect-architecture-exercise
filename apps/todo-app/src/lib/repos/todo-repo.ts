import { Context, Data, Effect, Option } from 'effect';
import { ParseResult } from '@effect/schema';

import { Todo } from '../domain/todo';
import { IdGenerator, TimestampGenerator } from '../core';

export class TodoRepoError extends Data.TaggedError('TodoRepoError')<{
  raw: unknown;
}> {}

export interface TodoRepo {
  save: (
    Todo: Todo
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | TodoRepoError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    TodoId: string
  ) => Effect.Effect<
    Option.Option<Todo>,
    ParseResult.ParseError | TodoRepoError
  >;
  list: Effect.Effect<
    ReadonlyArray<Todo>,
    ParseResult.ParseError | TodoRepoError
  >;
}

export const TodoRepo = Context.GenericTag<TodoRepo>('todo/repo');

export const { save: saveTodo, lookup: lookupTodo } =
  Effect.serviceFunctions(TodoRepo);

export const { list: listTodos } = Effect.serviceConstants(TodoRepo);
