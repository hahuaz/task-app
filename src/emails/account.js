const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail
    .send({
      to: email,
      from: "hahuaz@gmail.com",
      subject: "Thanks for joining in",
      text: `welcome to aboard, ${name}.`
    })
    .catch(e => {
      throw new Error("can't send email");
    });
};
module.exports = {
  sendWelcomeEmail
};
