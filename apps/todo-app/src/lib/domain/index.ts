import { Schema } from '@effect/schema';
import { Match } from 'effect';

import { TodoEvent } from './todo/events';
import { UserEvent } from './user/events';

export const DomainEvent = Schema.Union(TodoEvent, UserEvent);

export type DomainEvent = TodoEvent | UserEvent;

export const matchDomainEvent = Match.typeTags<DomainEvent>();
