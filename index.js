const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.suylw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = process.env.PORT || 8000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: '../bookshelf/public/images',
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname)
    }
})

const upload = multer({
    storage: storage
})


const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        const db = client.db(process.env.DB_NAME);
        const collection = db.collection('books');
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        app.post('/addBook', upload.single('image'), async (req, res) => {
            await client.connect();
            const newBook = req.body;
            newBook.image = req.file ? req.file.filename : null;
            const result = await collection.insertOne(newBook);
            res.json(result);
        });

        app.get('/books', async (req, res) => {
            await client.connect();
            const books = await collection.find({}).toArray();
            res.json(books);
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } finally {
        await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Nigga!');
});
