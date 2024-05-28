import { Data, Effect } from 'effect';

import { TodoEvent, TodoSubmitted } from './events';

export class Todo extends Data.Class<{
  id: string;
  timestamp: Date;
  title: string;
  events: TodoEvent[];
}> {}

export const createTodo = (todo: Omit<Todo, 'events'>) =>
  Effect.succeed(
    new Todo({
      ...todo,
      events: [
        new TodoSubmitted({
          id: todo.id,
          timestamp: todo.timestamp,
          title: todo.title,
        }),
      ],
    })
  );
