import { Effect, Option } from 'effect';

export function someOrFail<E2>(onNone: () => E2) {
  return function <A, E1, R>(fa: Effect.Effect<Option.Option<A>, E1, R>) {
    return Effect.flatMap(
      fa,
      Option.match({
        onNone: () => Effect.fail(onNone()),
        onSome: Effect.succeed,
      })
    );
  };
}

export function noneOrFail<E2>(onNone: () => E2) {
  return function <A, E1, R>(fa: Effect.Effect<Option.Option<A>, E1, R>) {
    return Effect.flatMap(
      fa,
      Option.match({
        onNone: () => Effect.void,
        onSome: () => Effect.fail(onNone()),
      })
    );
  };
}
