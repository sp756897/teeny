const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UrlSchema = new Schema({
    email: {
        type: String,
        required: true
    },

    listofUrls: [
        {
            fullurl: {
                type: String,
                required: true
            },
            shorturl: {
                type: String,
                required: true
            },
            clicked: {
                type: Number,
                default: 0
            },
        }
    ],

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Url = mongoose.model("urls", UrlSchema);