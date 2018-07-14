const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const books = [
  {
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling"
  },
  {
    title: "Jurassic Park",
    author: "Michael Crichton"
  }
];

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }

`;

const resolvers = {
  Query: {
    books: () => books
  }
};

const server = new ApolloServer({ typeDefs, resolvers, introspection: true });

server
  .listen({ port: process.env.PORT })
  .then(async ({ url }) => {
    const res = await fetch(
      `${process.env.CONSUL_HTTP}/agent/service/register`,
      {
        method: "PUT",
        body: JSON.stringify({
          Name: "Books",
          Tags: ["graphql"],
          Port: +process.env.PORT,
          Address: require("os").hostname()
        })
      }
    );
    console.log("result:", res.status, await res.text());
    if (res.ok) {
      console.log(`🚀  Service registered`);
    }
  })
  .catch(console.error);
