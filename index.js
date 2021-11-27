const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 7000;
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
var admin = require("firebase-admin");

app.use(cors());
app.use(express.json());
require("dotenv").config();

// mongodb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sovrn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// firebase services account
var serviceAccount = require("./assignment-12-firebase-sdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// chaking firebase id token
async function verifytoken(req, res, next) {
  if (req.headers.authorization.startsWith("Bearer")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const verifyemail = await admin.auth().verifyIdToken(token);
      req.verifyemail = verifyemail.email;
    } catch {}
  }

  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("Assignment-12");
    const productcollection = database.collection("products");
    const usercollection = database.collection("Users");
    const ordercollection = database.collection("Ordercollection");
    const reviewcollection = database.collection("Review");

    // get all product
    app.get("/products", async (req, res) => {
      const result = await productcollection.find({}).toArray();
      res.send(result);
    });

    // get limited api
    app.get("/products/limited", async (req, res) => {
      const result = await productcollection.find({}).limit(6).toArray();
      res.send(result);
    });

    // get single api
    app.get("/product/:id", async (req, res) => {
      const id = { _id: ObjectId(req.params.id) };
      const result = await productcollection.find(id).toArray();
      res.send(result);
    });

    // post user information
    app.post("/user", async (req, res) => {
      const result = await usercollection.insertOne(req.body);
      console.log(result);
    });

    // update user info
    app.put("/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: user.name,
          email: user.email,
        },
      };
      const result = await usercollection.updateOne(filter, updateDoc, options);
      console.log(result);
    });

    // post order
    app.post("/order", async (req, res) => {
      const result = await ordercollection.insertOne(req.body.orderdetail);
      res.send(result);
    });

    // get curent users order
    app.get("/order", async (req, res) => {
      const query = { email: req.query.email };
      const result = await ordercollection.find(query).toArray();
      res.send(result);
    });

    // delete order
    app.post("/order/delete/:id", async (req, res) => {
      const query = { _id: ObjectId(req.params.id) };
      const result = await ordercollection.deleteOne(query);

      res.send(result);
    });

    // get all order for admin
    app.get("/allorders", async (req, res) => {
      const result = await ordercollection.find({}).toArray();
      res.send(result);
    });

    // update order status
    app.post("/updatestatus/:id", async (req, res) => {
      const result = await ordercollection.updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: {
            status: req.body.status,
          },
        }
      );
      res.send(result);
    });

    // delete form all product
    app.delete("/product/delete/:id", async (req, res) => {
      const result = await productcollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(req.params.id);
    });

    // make  and chakin admin
    app.post("/makeadmin", verifytoken, async (req, res) => {
      if (req.verifyemail) {
        const user = await usercollection.findOne({
          email: req.verifyemail,
        });
        if (user.roll === "ADMIN") {
          const filter = { email: req.query.email };
          const updateDoc = {
            $set: {
              roll: "ADMIN",
            },
          };

          const result = await usercollection.updateOne(filter, updateDoc);
          res.send(result);
        }
      } else {
        res.status(404).json({ message: "You Are Not Verify Admin" });
      }
    });

    // checking admin
    app.get("/admin", async (req, res) => {
      const result = await usercollection.findOne({ email: req.query.email });
      let isadmin = false;
      if (result?.roll === "ADMIN") {
        isadmin = true;
      }
      res.send(isadmin);
    });

    // add new product
    app.post("/product/newadd", async (req, res) => {
      const result = await productcollection.insertOne(req.body.product);
      res.send(result);
      console.log(result);
    });

    // post review
    app.post("/review", async (req, res) => {
      const result = await reviewcollection.insertOne(req.body.fullreview);
      res.send(result);
      console.log(result);
    });

    // get all review
    app.get("/reviews", async (req, res) => {
      const result = await reviewcollection.find({}).toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("assignment 12 server runing ");
});

app.listen(port, () => {
  console.log("assignment 12 server runing in port :", port);
});


server running