import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';
import { folderResolvers } from './graphql/resolvers/folderResolvers.js';
import { bookmarkResolvers } from './graphql/resolvers/bookmarkResolvers.js';

async function startServer() {
  const schema = await loadSchema('./src/graphql/schema.graphql', {
    loaders: [new GraphQLFileLoader()],
  });

  const resolvers = {
    Query: {
      ...folderResolvers.Query,
      ...bookmarkResolvers.Query,
    },
    Mutation: bookmarkResolvers.Mutation,
    Folder: folderResolvers.Folder,
  };

  const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

  const yoga = createYoga({
    schema: schemaWithResolvers,
  });

  const server = createServer(yoga);

  server.listen(4000, () => {
    console.log('Server is running on http://localhost:4000/graphql');
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
