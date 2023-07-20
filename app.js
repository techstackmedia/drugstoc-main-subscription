const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const debug = require("debug");
const User = require("./models/User");
const app = express();
const db = debug("app:db");
const bug = debug("app:error");
const port = debug("app:port");

dotenv.config();
const PORT = process.env.PORT || 5000;

mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => db("MongoDB Connected"))
  .catch((err) => bug(err));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

app.post("/user", async (req, res) => {
  const { email, firstName, lastName } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({ email, firstName, lastName });
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Thank you for subscribing!",
      // text: `Dear ${firstName} ${lastName},\n\nThank you for subscribing to our newsletter. We will keep in touch.`,
      html: `<p>Dear ${firstName},</p>
         <p>I would like to extend a warm welcome to Drugstoc, where we distribute Anti-Counterfeit Supply Chain for Healthcare Providers. I am excited that you have subscribed to our newsletter and joined our community of healthcare providers dedicated to delivering safe, reliable, and high-quality healthcare.</p>
         <p><img src="https://res.cloudinary.com/bizstak/image/upload/v1683684642/info_drugstoc.com_dlkl0h.png" alt="Drugstoc logo" width="100%" height="auto"></p>
         <p>As a subscriber, you will receive updates on our latest products, industry news, and other resources to help you navigate the complex world of healthcare supply chain. Our goal is to provide you with the best possible information to help you make informed decisions about your healthcare business.</p>
         <p>We take your privacy seriously, and you can trust that we will never sell or share your information with any third parties. You can also unsubscribe at any time if you feel that our content is no longer relevant to your needs.</p>
         <p>Thank you once again for joining our community at Drugstoc. We look forward to keeping you informed and helping you succeed in your healthcare business.</p>
         Best regards, <br />
         Drugstoc Team
         <p>P.S. If you have any questions or feedback, feel free to reach out to us at info@drugstoc.com. We would love to hear from you!</p>
         `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        log(error);
      } else {
        log("Email sent: " + info.response);
      }
    });

    res.status(201).json({ message: "Subscribed to newsletter successfully" });
  } catch (error) {
    bug(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => port(`Server started on port ${PORT}`));
