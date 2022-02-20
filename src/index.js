require('dotenv').config();
const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

console.log(process.env.PORT);

const app = express();

/* parse req json into object */
app.use(express.json());

/* below we using middleware. this middleware runs before routing handlers run */
// app.use((req, res, next) => {
//   if (req.method === "GET") {
//     res.send("server is under maintenance. all get routing is unavailable");
//   } else {
//     next();
//   }
// });

app.use('/users', userRouter);
app.use('/tasks', taskRouter);

const port = process.env.PORT;
app.listen(port, () => {
  console.log('server is started', port);
});
