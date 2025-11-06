# Restaurant API

This project implements a GraphQL API using Node with Express.Js to provide menu data for a restaurant. The menu data is stored inside the `src/menu.js` file.

##### Follow these steps to run the API locally:

- Clone the GitHub repo
- Make sure you're using Node version >20
- Run `yarn` to install the necessary dependencies
- Run `yarn start` to start the development server

##### Usage:

To get data send a `POST` request at `http://localhost:3000/graphql` endpoint with the following body:

```
{
  query: `
    query {
      menu {
        appetizers {
          description
          items {
            name
            ingredients
            price
          }
        }
        entrees {
          description
          items {
            name
            ingredients
            price
          }
        }
      }
    }
  `
}
```
The response should look like this:
```
{
    "data": {
        "menu": {
            "appetizers": {
                "description": null,
                "items": [
                    {
                        "name": "Iceberg Wedge Salad with House Cured Bacon",
                        "ingredients": "tomato salsa gorgonzola",
                        "price": 7.5
                    },
                    {
                        "name": "Sautéed Shredded Brussels Sprouts",
                        "ingredients": "bacon hazelnuts gorgonzola",
                        "price": 6.95
                    },
                    {
                        "name": "Kale Salad",
                        "ingredients": "parmesan crisp corn radish garlic-lemon vinaigrette",
                        "price": 7.5
                    },
                    {
                        "name": "Pecan Crusted Utah Goat Cheese with Basil-Mint Pesto",
                        "ingredients": "grilled tomato salsa crostini",
                        "price": 6.95
                    },
                    {
                        "name": "Chicken and Cabbage Eggrolls",
                        "ingredients": "hot &amp; sour dipping sauce",
                        "price": 6.95
                    }
                ]
            }
        }
    }
}
```
You can retrieve data for different categories by extending the query using the same format e.g. `sandwiches`, `fajitas` etc.

### Unit Tests
This project also adds unit tests for the graphql endpoint using Jest and Supertest. The tests are present in the `__tests__` directory at the root level.

- Run `yarn run test` to execute the unit tests