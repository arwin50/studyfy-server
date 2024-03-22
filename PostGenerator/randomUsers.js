import mongoose from "mongoose";
import { User } from "../models/user.js";

main()
  .then(() => console.log("Connected to the Database"))
  .catch((err) => console.log("OHNO ERROR!", err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/studyfy");
}

export const users = [
  {
    googleId: "93810280319",
    displayName: "Levi Bacarra",
    email: "levibacarra@gmail.com",
    image:
      "https://www.looper.com/img/gallery/free-season-4-release-date-cast-and-plot-what-we-know-so-far/intro-1690734543.jpg",
    posts: [],
  },
  {
    googleId: "123817171983",
    displayName: "Renier Jardio",
    email: "renierjardio@gmail.com",
    image:
      "https://staticg.sportskeeda.com/editor/2023/06/c8108-16880550686799-1920.jpg?w=840",
    posts: [],
  },
  {
    googleId: "123131231231",
    displayName: "Louise Deiparine",
    email: "louisedeiparine@gmail.com",
    image:
      "https://i0.wp.com/www.spielanime.com/wp-content/uploads/2023/08/Jujutsu-Kaisen-Chapter-234-spoilers-How-does-Gojo-Satoru-lose-his-arm-against-Sukuna-.jpg?fit=1024%2C576&ssl=1",
    posts: [],
  },
  {
    googleId: "923810381023",
    displayName: "Arwin Delasan",
    email: "arwindelasan@gmail.com",
    image:
      "https://i.kym-cdn.com/entries/icons/facebook/000/030/971/Screen_Shot_2019-08-29_at_2.44.51_PM.jpg",
    posts: [],
  },
];

const generate = async () => {
  for (let user of users) {
    const newUser = new User(user);
    await newUser.save();
  }
};

generate().then(() => {
  mongoose.connection.close();
});
