import { Context, Data, Effect, Option } from 'effect';
import { ParseResult } from '@effect/schema';

import { User } from '../domain/user';
import { IdGenerator, TimestampGenerator } from '../core';

export class UserRepoError extends Data.TaggedError('UserRepoError')<{
  raw: unknown;
}> {}

export interface UserRepo {
  save: (
    user: User
  ) => Effect.Effect<
    void,
    ParseResult.ParseError | UserRepoError,
    IdGenerator | TimestampGenerator
  >;
  lookup: (
    userId: string
  ) => Effect.Effect<
    Option.Option<User>,
    ParseResult.ParseError | UserRepoError
  >;
  list: Effect.Effect<
    ReadonlyArray<User>,
    ParseResult.ParseError | UserRepoError
  >;
}

export const UserRepo = Context.GenericTag<UserRepo>('user/repo');

export const { save: saveUser, lookup: lookupUser } =
  Effect.serviceFunctions(UserRepo);

export const { list: listUsers } = Effect.serviceConstants(UserRepo);
