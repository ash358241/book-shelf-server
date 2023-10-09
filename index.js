const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        app.post('/comment/:id', async (req, res) => {
            await client.connect();

            const bookId = req.params.id;
            const feedbackData = req.body;

            const book = await collection.findOne({ _id: new ObjectId(bookId) });
            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }

            if (!book.feedback) {
                book.feedback = [];
            }
            book.feedback.push(feedbackData);

            const result = await collection.updateOne(
                { _id: new ObjectId(bookId) },
                { $set: { feedback: book.feedback } }
            );

            if (result.modifiedCount === 1) {
                res.status(200).json({ message: 'Feedback added successfully' });
            } else {
                res.status(500).json({ message: 'Failed to add feedback' });
            }
        })

        app.get('/books', async (req, res) => {
            await client.connect();
            const books = await collection.find({}).toArray();
            res.json(books);
        });

        app.get('/book/:id', async (req, res) => {
            await client.connect();
            const bookId = req.params.id;
            const book = await collection.findOne({ _id: new ObjectId(bookId) });
            if (book) {
                res.json(book);
            } else {
                res.status(404).json({ message: 'Book not found' });
            }
        });

        app.put('/editBook/:id', upload.single('image'), async (req, res) => {
            try {
                await client.connect();
                const bookId = req.params.id;
                const updatedBookData = req.body;
                updatedBookData.image = req.file ? req.file.filename : null;

                const existingBook = await collection.findOne({ _id: new ObjectId(bookId) });
                if (!existingBook) {
                    return res.status(404).json({ message: 'Book not found' });
                }

                const result = await collection.updateOne(
                    { _id: new ObjectId(bookId) },
                    { $set: updatedBookData }
                );

                if (result.modifiedCount === 1) {
                    res.status(200).json({ message: 'Book updated successfully' });
                } else {
                    res.status(500).json({ message: 'Failed to update book' });
                }
            } catch (error) {
                console.error('Error editing book:', error);
                res.status(500).json({ message: 'Internal server error' });
            } finally {
                await client.close();
            }
        });


        app.delete('/deleteBook/:id', async (req, res) => {
            await client.connect();
            const bookId = req.params.id;
            const result = await collection.deleteOne({ _id: new ObjectId(bookId) });
            if (result.deletedCount === 1) {
                res.status(200).json({ message: 'Book deleted successfully' });
            } else {
                res.status(404).json({ message: 'Book not found' });
            }
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
