require("dotenv").config();
const { v1: uuid } = require("uuid");
const { ApolloServer, gql, UserInputError } = require("apollo-server");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to MongoDB yay");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error.message);
  });

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String, published: Int): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String]!
    ): Book
    editAuthor(name: String!, setBornTo: Int): Author
  }
`;
const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      //
      //
      // let toBeReturned = [];
      // if (!args.author) {
      //   toBeReturned = books;
      // } else {
      //   toBeReturned = books.filter((item) => item.author === args.author);
      // }
      if (args.genre) {
        return Book.find({ genres: { $in: [args.genre] } });
      }
      return Book.find({});
    },
    allAuthors: () => Author.find({}),
  },
  Author: {
    bookCount: (root) =>
      books.filter((item) => item.author === root.name).length,
  },
  Mutation: {
    addBook: async (root, args) => {
      try {
        let author = await Author.findOne({ name: args.author });
        if (!author) {
          author = new Author({ name: args.author });
          await author.save();
        }
        const book = new Book({ ...args, author });
        await book.save();
        return book;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    editAuthor: async (root, args) => {
      try {
        let author = await Author.findOne({ name: args.name });
        console.log(author);
        if (author && args.setBornTo) {
          author.born = args.setBornTo;
          await author.save();
        } else {
          throw new UserInputError("Oops! We could not find that Author!");
        }
        return author;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
