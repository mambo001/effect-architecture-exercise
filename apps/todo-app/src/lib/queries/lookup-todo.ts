import { Schema } from '@effect/schema';

import { lookupTodo } from '../repos/todo-repo';
import { TodoNotFound, someOrFail } from '../common';

export class LookupTodoQuery extends Schema.Class<LookupTodoQuery>(
  'LookupTodoQuery'
)({
  id: Schema.String,
}) {}

export function handleLookupTodoQuery(query: LookupTodoQuery) {
  return lookupTodo(query.id).pipe(someOrFail(() => new TodoNotFound()));
}
