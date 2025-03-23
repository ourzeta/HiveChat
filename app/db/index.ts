import { drizzle as neon } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/postgres-js';

import { llmModels, users, llmSettingsTable, appSettings, groups, groupModels, mcpServers } from './schema'
import * as relations from './relations';

const getDbInstance = () => {
  if (process.env.VERCEL) {
    return neon(process.env.DATABASE_URL!,
      { schema: { users, llmModels, llmSettingsTable, appSettings, groups, groupModels, mcpServers, ...relations } });
  } else {
    return drizzle(process.env.DATABASE_URL!,
      { schema: { users, llmModels, llmSettingsTable, appSettings, groups, groupModels, mcpServers, ...relations } });
  }
}

export const db = getDbInstance();
// export const db = drizzle(process.env.DATABASE_URL!, { schema: { users, llmModels, llmSettingsTable } });