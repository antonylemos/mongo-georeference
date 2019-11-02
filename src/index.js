const MongoClient = require("mongodb").MongoClient;

const url = "mongodb://localhost:27017";
const database = "restaurants";
var collection;

var restaurants;

const findRestaurants = () =>
  new Promise((resolve, reject) => {
    console.log("Buscando restaurantes...");

    collection
      .find()
      .project({ _id: 1, "address.coord": 1 })
      .toArray((err, result) => {
        if (err) reject(err);

        restaurants = result;

        resolve();
      });
  });

const updateRestaurantsCoords = () =>
  new Promise((resolve, reject) => {
    console.log("Atualizando campos...");

    restaurants.map(restaurant => {
      collection.updateOne({ _id: restaurant._id }, [
        {
          $set: {
            "address.location": {
              type: "Point",
              coordinates: [
                restaurant.address.coord[1],
                restaurant.address.coord[0]
              ]
            }
          }
        },
        { $unset: "address.coord" }
      ]);
    });

    resolve();
  });

const createIndex = () =>
  new Promise((resolve, reject) => {
    console.log("Criando índice...");

    collection.createIndex({ "address.location": "2dsphere" });

    resolve();
  });

const findProximity = () =>
  new Promise((resolve, reject) => {
    console.log(
      "Buscando restaurantes próximos ao Port Authority Bus Terminal (NY)..."
    );

    collection
      .find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [-73.9903, 40.757]
            },
            $maxDistance: 1000
          }
        }
      })
      .toArray((err, docs) => {
        if (err) reject(err);

        console.log("Restaurantes encontrados:\n", docs);

        resolve();
      });
  });

const app = async (err, client) => {
  try {
    if (err) {
      console.log("Erro na conexão!");
      return;
    }

    console.log("Conectado!");

    const db = client.db(database);
    collection = db.collection("restaurants");

    await findRestaurants();
    await updateRestaurantsCoords();
    await createIndex();
    await findProximity();
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
};

MongoClient.connect(url, app);
