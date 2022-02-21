const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username can't be blank"]
    },
    password: {
        type: String,
        required: [true, "Password can't be blank"]
    }
})

module.exports = mongoose.model('User', userSchema);