
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

import { weatherAgent } from './agents/weather-agent';
import { dictionaryAgent } from './agents/dictionary-agent';
import { movieAgent } from './agents/movie-agent';
import { zooAnimalsAgent } from './agents/zoo-animals-agent';
import { carPriceAgent } from './agents/car-price-agent';

export const mastra = new Mastra({
  agents: { weatherAgent, dictionaryAgent, movieAgent, zooAnimalsAgent, carPriceAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
