import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from './database/database.js';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI();

const makeNewDescription = async (make, model, year, color) => {
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
            role: 'user', content:
                `Make a description for selling a ${year} ${make} ${model}.
                Following the example: Experience the thrill of driving with this stunning ${year} ${make}
                ${model} in vibrant ${color}. This iconic car combines
                classic sports car charm with modern technology, offering an exhilarating driving experience.
                But limit the description to between 170 and 180 characters.
            ` }],
    });
    // console.log(completion.choices[0]?.message?.content);
    return completion;
}

const carModels = {
    1: 'Corolla',
    2: 'Civic',
    3: 'Mustang',
    4: 'Malibu',
    5: 'Altima',
    6: '3 Series',
    7: 'A4',
    8: 'C-Class',
    9: 'Golf',
    10: 'Elantra',
    11: 'Sorento',
    12: 'Outback',
    13: 'Mazda3',
    14: 'Cybertruck',
    15: '911 Carrera',
    16: 'Portofino'
};

const carMakes = {
    1: 'Toyota',
    2: 'Honda',
    3: 'Ford',
    4: 'Chevrolet',
    5: 'Nissan',
    6: 'BMW',
    7: 'Audi',
    8: 'Mercedes-Benz',
    9: 'Volkswagen',
    10: 'Hyundai',
    11: 'Kia',
    12: 'Subaru',
    13: 'Mazda',
    14: 'Tesla',
    15: 'Porsche',
    16: 'Ferrari'
};

const carColors = {
    1: 'Red',
    2: 'Blue',
    3: 'Green',
    4: 'Black',
    5: 'White',
    6: 'Silver',
    7: 'Gray',
    8: 'Yellow',
    9: 'Orange',
    10: 'Purple',
    11: 'Brown',
    12: 'Pink'
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, 'dist')));
//ONLY USING CORS FOR DEV PURPOSES
app.use(cors())

app.use(session({
    secret: 'your-secret-key', // Add a secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
}));

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

//ROUTE TO GET ALL CARS
app.get('/cars', async (req, res) => {
    const result = await pool.query(`
    SELECT 
	Cars.id, mileage, arrival_date, year,
	price, availability, date_sold, 
	image_id, review_id, color, make, 
	model, body_style, fuel_type, description
	FROM Cars 
	JOIN Colors ON Cars.color_id=Colors.id
	JOIN Makes ON Cars.make_id=Makes.id
	JOIN Models ON Cars.model_id=Models.id
	JOIN Bodies ON Cars.body_id=Bodies.id
	JOIN Fueltype ON Cars.fuel_id=Fueltype.id;
    `);
    res.json(result.rows)
});

app.delete('/cars', async (req, res) => {
    const result = await pool.query(`
        DELETE FROM Cars WHERE id=${req.body.id} 
        `).then((result) => {
        return res.status(204).send(result)
    })
})

app.get('/colors', async (req, res) => {
    const result = await pool.query('SELECT * FROM colors;');
    res.json(result.rows)
});

app.get('/makes', async (req, res) => {
    const result = await pool.query('SELECT * FROM makes;');
    res.json(result.rows)
});

app.get('/models', async (req, res) => {
    const result = await pool.query('SELECT * FROM models;');
    res.json(result.rows)
});

app.get('/fuels', async (req, res) => {
    const result = await pool.query('SELECT * FROM fueltype;');
    res.json(result.rows)
});

app.get('/bodies', async (req, res) => {
    const result = await pool.query('SELECT * FROM bodies;');
    res.json(result.rows)
});

//Route to get all reviews
app.get('/reviews', async (req, res) => {
    const result = await pool.query('SELECT * FROM reviews');
    res.json(result.rows)
});

app.post('/cars', async (req, res) => {
    const {
        year,
        make_id,
        model_id,
        color_id,
        body_id,
        mileage,
        fuel_id,
        arrival_date,
        price,
        availability,
        date_sold,
    } = req.body;

    try {
        const query = `
            INSERT INTO Cars (
                year, make_id, model_id, color_id, body_id, mileage, fuel_id, promo_id, arrival_date, price, availability, date_sold, image_id, description
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) RETURNING *;
        `;
        const values = [
            year, make_id, model_id, color_id, body_id, mileage, fuel_id, 1, arrival_date, price, availability, date_sold, 1
        ];

        makeNewDescription(carMakes[make_id], carModels[model_id], year, carColors[color_id])
        .then(async (response) => {
            values.push(response.choices[0]?.message?.content)
            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//route to make a new reivew
app.post('/reviews', upload.single('avatar'), async (req, res) => {
    const { review, rating } = req.body;
    const user = req.session.userData;

    if (!user) {
        return res.status(401).send('User not logged in');
    }

    const name = user.username;
    const avatar = user.avatar;

    try {
        await pool.query(
            'INSERT INTO reviews (name, rating, review, avatar) VALUES ($1, $2, $3, $4)',
            [name, rating, review, avatar]
        );
        res.status(201).send('Review added successfully');
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).send('Server error');
    }
});


app.patch('/availability/:id', async (req, res) => {
    let id = (req.params.id)
    const result = await pool.query(`UPDATE Cars SET Availability = NOT Availability WHERE id = ${id}`);
    res.json(result)
});

//make a new user
app.post('/register', upload.single('avatar'), async (req, res) => {
    const { firstName, lastName, email, username, password, role } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            return res.status(400).send('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (first_name, last_name, email, username, password, role, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [firstName, lastName, email, username, hashedPassword, role, avatar]
        );
        res.status(201).send('User added successfully');
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

//Route to login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).send('Invalid username or password');
        }

        // Store user data in the session
        req.session.userData = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            role: user.role
        };

        // Send user data to the client
        res.json(req.session.userData);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }

});

// Get user favorite by user id and car id
app.get('/favorite', async (req, res) => {
    const { userId, carId } = req.query;
    console.log('userId:', userId, 'carId:', carId);
    try {
        const result = await pool.query('SELECT * FROM userfavorites WHERE user_id = $1 AND car_id = $2', [userId, carId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting favorite:', error);
        res.status(500).send('Server error');
    }
});

// GET User Favorites
app.get('/favorites', async (req, res) => {
    const userId = req.query.userId;
    console.log('query:', req.query, 'userId:', userId);
    try {
        const result = await pool.query(`
            SELECT 
                Cars.id AS car_id, mileage, arrival_date, year,
                price, availability, date_sold, 
                image_id, review_id, color, make, 
                model, body_style, fuel_type, description
            FROM Cars 
            JOIN userfavorites ON Cars.id = userfavorites.car_id
            JOIN Colors ON Cars.color_id = Colors.id
            JOIN Makes ON Cars.make_id = Makes.id
            JOIN Models ON Cars.model_id = Models.id
            JOIN Bodies ON Cars.body_id = Bodies.id
            JOIN Fueltype ON Cars.fuel_id = Fueltype.id
            WHERE user_id = $1
        `, [userId]);
        console.log('db query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).send('Server error');
    }
});


// POST User Favorited Car
app.post('/favorites', async (req, res) => {
    console.log('req.body:', req.body);
    const { userId, carId } = req.body;
    try {
        await pool.query(
            'INSERT INTO userfavorites (user_id, car_id) VALUES ($1, $2)',
            [userId, carId]
        );
        res.status(201).send('Favorite added successfully');
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).send('Server error');
    }
});

// DELETE User Favorited Car
app.delete('/favorites', async (req, res) => {
    const { userId, carId } = req.body;
    console.log('userId:', userId, 'carId:', carId);
    try {
        await pool.query(
            'DELETE FROM userfavorites WHERE user_id = $1 AND car_id = $2',
            [userId, carId]
        );
        res.status(200).send('Favorite deleted successfully');
    } catch (error) {
        console.error('Error deleting favorite:', error);

        res.status(500).send('Server error');
    }

});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});