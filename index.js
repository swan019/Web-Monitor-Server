const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const axios = require("axios");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const userRoutes = require("./app/User/UserRoute");
const webRoutes = require("./app/Website/WebsiteRoutes");
const WebsiteSchema = require("./app/Website/WebsiteSchema");

const app = express();
app.use(cookieParser());

app.use(cors());
app.use(express.json());

app.use(userRoutes);
app.use(webRoutes);

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.G_EMAIL,
    pass: process.env.G_PASSWORD,
  },
});

const isSiteActive = async (url) => {
  if (!url) return false;

  const res = await axios.get(url).catch((err) => void err);

  if (!res || res.status !== 200) return false;

  return true;
};

cron.schedule("0 */1 * * *", async () => {
  const allWebsites = await WebsiteSchema.find({}).populate({
    path: "userId",
    select: ["name", "email"],
  });
  if (!allWebsites.length) return;

  for (let i = 0; i < allWebsites.length; ++i) {
    const website = allWebsites[i];
    const url = website.url;

    const isActive = await isSiteActive(url);
    WebsiteSchema.updateOne(
      { _id: website._id },
      {
        isActive,
      }
    ).exec();

    if (!isActive && website.isActive) {
      transport.sendMail({
        from: process.env.G_EMAIL,
        to: website.userId.email,
        subject: "⚠️ Urgent: Website Downtime Alert - Immediate Attention Required",
        html: `
          <p>Dear ${website.userId.name},</p>
          <p>We wanted to inform you that your website <b><a href="${website.url}">${website.url}</a></b> is currently <span style="color:red;">unavailable</span> as of <b>${new Date().toLocaleDateString("en-in")}</b>.</p>
          <p>This may be due to technical issues on the server or hosting platform. It’s important to address this promptly to minimize disruption to your users and business.</p>
          <p>Here’s a quick summary of the incident:</p>
          <ul>
            <li><b>Website:</b> ${website.url}</li>
            <li><b>Status:</b> Down</li>
            <li><b>Checked on:</b> ${new Date().toLocaleDateString("en-in")}</li>
          </ul>
          <p>Please check your hosting or server configuration and take the necessary steps to restore your site’s functionality.</p>
          <p>If you have any questions or need further assistance, feel free to reach out to us.</p>
          <p>Best regards,<br>Your Monitoring Team</p>
        `,
      });
    }
    
  }
});

app.listen(5000, () => {
  console.log("Backend is up at port 5000");

  mongoose.set("strictQuery", true);
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Established a connection with the database"))
    .catch((err) => console.log("Error connecting to database", err));
});
