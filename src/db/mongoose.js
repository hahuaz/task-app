const mongoose = require("mongoose");

/* we declare database name in connection.if there is no with given name it will create it */
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((data) => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(`failed to connect database
  ${err}`);
  });

/* HOW TO create new user in database */
// const aTask = new Task({
//   description: "clean house"
// });

// aTask
//   .save()
//   .then(res => console.log(res))
//   .catch(err => console.log(err));
