const express = require("express");
const Task = require("./../models/task.js");
const auth = require("./../middleware/auth");
const taskRouter = new express.Router();

taskRouter.post("", auth, async (req, res) => {
  const task = new Task({
    ...req.body /* spread operetor. it will spread key-pair if it used on object */,
    owner: req.user._id
  });
  try {
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});
// ?completed=true
// ?limit=10&skip=10   ilk 10 datayi geçip 11.ve20. datayı gösterirdi arasi dahil. pagination için böyle yapılır
// ?sortBy=createdAt_asc
taskRouter.get("", auth, async (req, res) => {
  const match = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  let sort = {
    // createdAd: 1  data will be sorted ascending, if -1 descending
    updatedAd:
      -1 /* zamanı timestamp olarak düşün. en eskinin değeri daha az. so decending ile en eski aşşağıda gözükür çünkü o en az */
    // completed: 1 false is above
  };
  if (req.query.sortBy) {
    sort = {};
    parts = req.query.sortBy.split("_");
    sort[parts[0]] =
      parts[1] === "asc" ? 1 : -1; /* it will be like sort[createdAt]= 1 */
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match: match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort: sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

taskRouter.patch("/:id", auth, async (req, res) => {
  /* örneğin updates'de password var. eğer allowedArr, password içermiyorsa invalid operation. */
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  ); /* will return true or false */
  if (isValidOperation) {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        owner: req.user._id
      }); /* burda nedense find kullanamıyorum.????*/
      if (!task) {
        /* findOne will not throw err if can't find task. it will return null. so we have to do this */
        return res.status(404).send("can't find task");
      }
      updates.forEach((update) => (task[update] = req.body[update]));
      await task.save();
      res.send(task);
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  } else {
    res.status(400).send("invalid operation");
  }
});
taskRouter.delete("/:id", auth, async (req, res) => {
  try {
    task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    }); /* if can't find it won't throw err. so you have to handle it */
    if (!task) {
      return res.status(404).send("can't find task");
    }
    res.send("deleted");
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

module.exports = taskRouter;
