const mongoose = require('mongoose');

// Creating user schema
const UserSchema = new mongoose.Schema({
    tg_id: { type: Number },
    is_bot: { type: Boolean },
    first_name: { type: String },
    last_name: { type: String },
    username: { type: String },
    is_active: { type: Boolean, default: false },
    bot_name: { type: String },
    last_action: { type: String }
},
    {
        timestamps: true
    })

// Statics
UserSchema.static('build', (attrs) => { return new User(attrs) })

// Creating user model
const User = mongoose.model('User', UserSchema)

module.exports = { User }