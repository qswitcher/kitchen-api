const { unpack } = require('../indexer');

describe('unpack', () => {
  it('converts', () => {
    expect(
      unpack({
        longDescription: {
          S: 'Finger licking good',
        },
        instructions: {
          L: [
            {
              S: 'cook it',
            },
            {
              S: 'eat it',
            },
          ],
        },
        thumbnail: {
          NULL: true,
        },
        data: {
          S: 'best-mac-and-cheese-recipe',
        },
        user_id: {
          S: 'e1940bcf-c7d1-4c01-bb5f-5f743a208dd4',
        },
        ingredients: {
          L: [
            {
              S: 'cheese',
            },
            {
              S: 'milk',
            },
            {
              S: 'noodles',
            },
            {
              S: 'cream',
            },
          ],
        },
        photo: {
          S: '1588997059400-stovetop-macaroni-cheese-1.jpg',
        },
        shortDescription: {
          S: 'This is the best maccaronni in the world',
        },
        sort: {
          S: 'Recipe',
        },
        title: {
          S: 'Best mac and cheese recipe',
        },
        key: {
          S: '46143bf4-7a88-454f-83d8-e4564d985fab',
        },
        slug: {
          S: 'best-mac-and-cheese-recipe',
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "data": "best-mac-and-cheese-recipe",
        "ingredients": Array [
          "cheese",
          "milk",
          "noodles",
          "cream",
        ],
        "instructions": Array [
          "cook it",
          "eat it",
        ],
        "key": "46143bf4-7a88-454f-83d8-e4564d985fab",
        "longDescription": "Finger licking good",
        "photo": "1588997059400-stovetop-macaroni-cheese-1.jpg",
        "shortDescription": "This is the best maccaronni in the world",
        "slug": "best-mac-and-cheese-recipe",
        "sort": "Recipe",
        "thumbnail": null,
        "title": "Best mac and cheese recipe",
        "user_id": "e1940bcf-c7d1-4c01-bb5f-5f743a208dd4",
      }
    `);
  });
});
