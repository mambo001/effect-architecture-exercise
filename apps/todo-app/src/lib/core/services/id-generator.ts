import { Context, Effect } from 'effect';

export interface IdGenerator {
  generate: Effect.Effect<string>;
}

export const IdGenerator = Context.GenericTag<IdGenerator>(
  'core/services/id-generator'
);

export const { generate: generateId } = Effect.serviceConstants(IdGenerator);
