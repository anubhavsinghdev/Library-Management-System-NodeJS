const express = require("express");
const app = express();
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/LMS")

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static('public'));

app.get("/", (req, res)=>{
    res.render("home");
})


app.listen(3000, () => {
    console.log("On 3000!");
})