const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User" /* reference to the User model(documentation) */
    }
  },
  {
    /* you have to see this one an object on schema's second armgument */
    timestamps: true /* this will add 2 field to document. createdAt, updatedAt */
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
