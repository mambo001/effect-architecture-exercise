import { Data, Effect } from 'effect';

import { UserEvent, UserSubmitted } from './events';

export class User extends Data.Class<{
  id: string;
  firstName: string;
  lastName: string;
  events: UserEvent[];
}> {}

export const createUser = (user: Omit<User, 'events'>) =>
  Effect.succeed(
    new User({
      ...user,
      events: [
        new UserSubmitted({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      ],
    })
  );
