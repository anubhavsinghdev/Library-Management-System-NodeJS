const express = require("express");
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
mongoose.connect("mongodb://localhost:27017/LMS")
const User = require('./models/user');
const Book = require('./models/book');
const Student = require('./models/student');
const req = require("express/lib/request");
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: "secret",
    cookie: { maxAge: 24 * 60 * 60 * 1000 * 365 },
    saveUninitialized: true,
    resave: true
}));
app.use((req, res, next) => {
    res.locals.currentUser = req.session.username;
    next();
});
const requireLogin = (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    next();
}
app.get("/", (req, res) => {
    res.render("home");
})

app.get("/sign-up", (req, res) => {
    res.render("sign-up");
})

app.post("/sign-up", (req, res) => {
    const { username, password } = req.body;
    User.find({ username }, (err, docs) => {
        if (docs.length) {
            res.send("user already created");
        } else {
            User.create({ username: username, password: password }, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    res.send("user created");
                }
            })
        }
    })
})


app.get("/login", (req, res) => {
    res.render("login");
})
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username }, (err, docs) => {
        if (docs) {
            if (password === docs.password) {
                req.session.username = username;
                res.redirect("/");
            } else {
                res.send("wrong username or password");
            }
        } else {
            res.send("user not registered");
        }
    })
})

app.get("/add-books", requireLogin, (req, res) => {
    res.render("add-books");
})

app.post("/add-books", (req, res) => {
    const { isbn, name, author, quantity } = req.body;
    Book.findOne({ isbn }, (err, docs) => {
        if (docs) {
            let q = parseInt(docs.quantity);
            q += parseInt(quantity);
            Book.findOneAndUpdate({ isbn: isbn }, {
                $set: {
                    quantity: q
                }
            }, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    res.send("updated");
                }
            })
        }
        else {
            Book.create({ isbn: isbn, name: name, author: author, quantity: quantity }, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    res.send("added");
                }
            })
        }
    })
})

app.get("/books", requireLogin, (req, res) => {
    Book.find({}, (err, docs) => {
        if (docs) {
            res.render("books", { docs });
        } else {
            res.render("books", { docs: "" });
        }
    })

})

app.post("/books/delete", (req, res) => {
    const { isbn } = req.body;
    Book.findOneAndDelete({ isbn }, (err, docs) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/books")
        }
    }
    )
})

app.get("/add-user", (req, res) => {
    res.render("add-user");
})

app.post("/add-user", (req, res) => {
    const { name, studentid } = req.body;
    Student.create({ name: name, studentid: studentid, issuedBooks: [] }, (err, docs) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/add-user");
        }
    })
})

app.get("/issue-books", (req, res) => {
    res.render("issue-books");
})

app.post("/issue-books", (req, res) => {
    const { studentid, isbn } = req.body;
    Student.findOne({ studentid }, (err, docs) => {
        if (docs) {
            Book.findOne({ isbn }, (err, docs) => {
                if (docs && docs.quantity >= 1) {
                    let q = parseInt(docs.quantity);
                    q -= 1;
                    Book.updateOne({ isbn }, { quantity: q }, (err, docs) => {
                        if (err) {
                            console.log(err);
                        } else {
                            Student.findOneAndUpdate({ studentid }, {
                                $push: {
                                    issuedBooks: isbn
                                }
                            }, (err, docs) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    res.send("issued");
                                }
                            }
                            )
                        }
                    })
                } else {
                    res.send("book not available");
                }
            })
        } else {
            res.send("Inavlid Student ID");
        }
    })
})

app.get("/students", requireLogin, (req, res) => {
    Student.find({}, (err, docs) => {
        if (docs) {
            res.render("students", { docs });
        } else {
            res.render("students", { docs: "" });
        }
    })
})
app.post("/students/delete", (req, res) => {
    const { studentid } = req.body;
    Student.findOneAndDelete({ studentid }, (err, docs) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/students")
        }
    }
    )
})

app.get("/return-book", requireLogin, (req, res) => {
    res.render("return-book");
})

app.post("/return-book", (req, res) => {
    const { studentid, isbn } = req.body;
    Book.findOne({ isbn }, (err, docs) => {
        if (docs) {
            let q = parseInt(docs.quantity);
            q += 1;
            Book.findOneAndUpdate({ isbn }, {
                $set: {
                    quantity: q
                }
            }, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    Student.findOneAndUpdate({ studentid }, {
                        $pull: {
                            issuedBooks: isbn
                        }
                    }, (err, docs) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.send("return");
                        }
                    }
                    )
                }
            }
            )
        }
    })
})

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
})

app.listen(3000, () => {
    console.log("On 3000!");
})