export const typeDefs = `#graphql
  type MenuItem {
    name: String!
    ingredients: String!
    price: Float!
  }

  type Category {
    description: String
    items: [MenuItem!]!
  }

  type Menu {
    appetizers: Category!
    entrees: Category!
    sandwiches: Category!
    soupAndSalad: Category!
    fajitas: Category!
    tacos: Category!
    enchiladas: Category!
    quiche: Category!
    greenSalads: Category!
  }

  type SearchResult {
    "Key of the category the item belongs to, e.g. greenSalads."
    category: String!
    item: MenuItem!
  }

  type Query {
    menu: Menu!
    """
    Items whose name or ingredients contain the term (case-insensitive),
    optionally no dearer than maxPrice, cheapest first.
    """
    searchItems(term: String!, maxPrice: Float): [SearchResult!]!
  }
`;
