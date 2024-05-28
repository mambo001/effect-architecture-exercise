import { Data } from 'effect';

export class TodoNotFound extends Data.TaggedError('TodoNotFound') {}

export class UserNotFound extends Data.TaggedError('UserNotFound') {}
