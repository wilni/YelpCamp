const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const joi = require('joi')

const wrapAsync = require('./utility/wrapAsync');
const ExpressErrors = require('./utility/ExpressErrors');
const Campground = require('./models/campground');
const methodOverride = require('method-override');


mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("database connected")
});

const app = express();

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))



app.get('/', (req, res) => {
    res.render('home')
});

app.get('/campgrounds', wrapAsync(async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds })
}))

app.get('/makeCampground', wrapAsync(async (req, res, next) => {
    const camp = new Campground({ title: 'My Backyard', description: 'cheap camping' });
    await camp.save();
    res.send(camp)
}));

app.get('/campground/new', (req, res) => {
    res.render('campgrounds/new')
});

app.get('/campgrounds/:id', wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    console.log(campground)
    res.render('campgrounds/show.ejs', { campground })
}));


app.post('/campgrounds', wrapAsync(async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressErrors('Please complete the form correctly', 400)

    const campgroundSchema = Joi.object({
        campground: Joi.object({
            title: Joi.string().required(),
            price: Joi.number().required(),
            // image: Joi.string().required().min(0),
            // description: Joi.string().required(),
            // location: Joi.string().required()
        }).required()
    })
    const results = campgroundSchema.validate(req.body);
    console.log(results)
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`campgrounds/${campground._id}`)
}));

app.get('/campgrounds/:id/edit', wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    // console.log(campground)
    res.render('campgrounds/edit.ejs', { campground })
}));

app.put('/campgrounds/:id', wrapAsync(async (req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, req.body.campground, {runValidators: true, new: true});
    // console.log(req.body)
    // console.log(campground)
    res.redirect(`${id}`)
}));

app.delete('/campgrounds/:id', wrapAsync(async (req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndDelete(id)
    res.redirect('/campgrounds')
}));

app.all('*', (req, res, next) => {
    next(new ExpressErrors('page not found', 404))
})

app.use((err, req, res, next) => {
    const {status = 500} = err; 
    if(!err.message) err.message = 'something went wrong';
    res.status(status).render('error.ejs', {err});

    res.send('something went wrong')
})


app.listen(3000, () => {
    console.log('Port 3000 Serving')
});
