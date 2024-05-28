import { Match } from 'effect';
import { Schema } from '@effect/schema';

export class UserSubmitted extends Schema.TaggedClass<UserSubmitted>()(
  'CheckInSubmitted',
  {
    id: Schema.String,
    firstName: Schema.String,
    lastName: Schema.String,
  }
) {}

export const UserEvent = Schema.Union(UserSubmitted);

export type UserEvent = UserSubmitted;

export const matchUserEvent = Match.typeTags<UserEvent>();
