export const typeDefs = `
  type MenuItem {
    name: String
    ingredients: String
    price: Float
  }
  
  type Category {
    description: String
    items: [MenuItem]
  }

  type Menu {
    appetizers: Category
    entrees: Category
    sandwiches: Category
    soupAndSalad: Category
    fajitas: Category
    tacos: Category
    enchiladas: Category
    quiche: Category
    greenSalads: Category
  }

  type Query {
    menu: Menu
  }
`;
