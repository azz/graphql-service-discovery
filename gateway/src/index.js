const { ApolloServer } = require("apollo-server");
const { createHttpLink } = require("apollo-link-http");
const {
  introspectSchema,
  makeRemoteExecutableSchema,
  mergeSchemas,
  transformSchema,
  RenameTypes,
  RenameRootFields
} = require("graphql-tools");
const fetch = require("node-fetch");

const run = async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));

  const consulServices = await (await fetch(
    `${process.env.CONSUL_HTTP}/agent/services`
  )).json();
  // Filter by services with the "graphql" tag
  const services = Object.keys(consulServices)
    .filter(key => consulServices[key].Tags.includes("graphql"))
    .map(key => consulServices[key])
    .map(service => ({
      name: service.Service,
      uri: `http://${service.Address}:${service.Port}`
    }));

  const schemas = await Promise.all(
    services.map(async ({ name, uri }) => {
      console.log("discovered service:", name, uri);
      const link = createHttpLink({ uri, fetch });
      const schema = await introspectSchema(link);

      const transformedSchema = transformSchema(schema, [
        new RenameTypes(type => `${name}_${type}`),
        new RenameRootFields((operation, field) => `${name}_${field}`)
      ]);
      // return makeRemoteExecutableSchema({ schema: transformedSchema, link });
      return makeRemoteExecutableSchema({ schema, link });
    })
  );

  const server = new ApolloServer({
    schema: mergeSchemas({
      schemas,
      resolvers: mergeInfo => ({})
    })
  });

  const { url } = await server.listen({ port: process.env.PORT });
  console.log(`🚀  Server ready at ${url}`);
};

run().catch(console.error);
