const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.suylw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = process.env.PORT || 8000;

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db(process.env.DB_NAME).command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } finally {
        await client.close();
    }
}
run().catch(console.dir);
