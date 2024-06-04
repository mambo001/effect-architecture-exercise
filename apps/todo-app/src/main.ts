import { NodeRuntime } from '@effect/platform-node';

import { main } from './environment/environment';

NodeRuntime.runMain(main);