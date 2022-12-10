const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndj1c5s.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionCollection = client.db("doctorsPortal").collection("appointmentOptions");
        const bookingsCollection = client.db("doctorsPortal").collection("bookings");


        app.get('/appointmentOptions', async(req, res) => {
            const date = req.query.date;
            // console.log(date);
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment == option.name);
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
                console.log(date, option.name, bookedSlots);
            })
            res.send(options);
        });
        

        app.get('/bookings', async(req, res) =>{
            const email = req.query.email;
            console.log(email);
            const query = {email: email};
            const bookings  = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async(req, res) => {
            const booking = req.body
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }

            const alradyBooked = await bookingsCollection.find(query).toArray();

            if (alradyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
    } finally {

    }
}
run().catch(console.log);


app.get('/', async(req, res) => {
    res.send('Doctors portal server is running');
})

app.listen(port, () => console.log(`Doctors portal running on ${port}`));