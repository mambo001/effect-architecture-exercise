import { Context, Effect } from 'effect';

export interface TimestampGenerator {
  generate: Effect.Effect<Date>;
}

export const TimestampGenerator = Context.GenericTag<TimestampGenerator>(
  'core/services/timestamp-generator'
);

export const { generate: generateTimestamp } =
  Effect.serviceConstants(TimestampGenerator);
