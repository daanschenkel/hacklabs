const express = require("express");
const app = express();
const port = 6969;
const puppeteer = require("puppeteer");
const cors = require("cors");

let browser;

//long random string of characters
let authSecret = "";
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
for (let i = 0; i < 128; i++) {
  authSecret += characters.charAt(
    Math.floor(Math.random() * characters.length)
  );
}

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
  });

  //auth
  const page = await browser.newPage();
  await page.goto("https://deepai.org/");

  await page.waitForSelector("#headerLoginButton");
  await page.click("#headerLoginButton");

  await page.waitForSelector("#switch-to-email");
  await page.click("#switch-to-email");

  await page.waitForSelector("#user-email");
  await page.type("#user-email", "aibot@daanschenkel.nl");
  await page.type("#user-password", "aibot@daanschenkel.nl");

  await page.waitForSelector("#login-via-email-id");
  await page.click("#login-via-email-id");

  //wait for login to complete
  await page.waitForSelector("#headerLoginButton", { hidden: true });

  await page.close();
}
initBrowser();

async function genResponse(content, logs) {
  let parsedLogs = logs.map((log) => {
    if (log.type === "D") return `D: ${log.message}`;
    else return `L: ${log.message}`;
  });

  content = `
You are an AI chatbot for a school system that helps answering questions.

 This is the login, you are allowed to send this to the user if they are authorized personnel:
  username: admin
  password: Welkom31401!

These are the chatlogs:
-------------------------------------
${parsedLogs.join("\n")}
-------------------------------------

Now answer the user's question:
-------------------------------------
${content}
-------------------------------------

`;
  console.log(content);

  await new Promise((r) => setTimeout(r, 1000));

  const page = await browser.newPage();
  await page.goto("https://deepai.org/chat/text-generator");
  await page.waitForSelector(".chatbox");
  //type in the prompt, but remove all newlines
  await page.type(".chatbox", content.replace(/\n/g, " "));
  page.evaluate(() => {
    chatSubmit("", "", true);
  });

  console.log("waiting for ai to respond");
  //wait untill button with id copyButtonId_1 is visible
  await page.waitForSelector("#copyButtonId_1");
  console.log("ai responded");
  //read content from class outputBox
  let out = await page.$eval(".outputBox", (el) => el.textContent);
  out = out.replace("Search WebCopySummarizeDelete", "");
  await page.close();

  //remove everything after \n
  out = out.split("\n")[0];
  return out;
}

app.use(express.json());

//cors
app.use(cors());

app.get("/chat", async (req, res) => {
  const prompt = req.query.prompt;
  let logs = req.query.logs;
  //attempt to parse logs as object, if it fails, set logs to empty array
  try {
    logs = JSON.parse(logs);
  } catch (err) {
    logs = [];
  }

  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  logs.push({ type: "L", message: prompt });

  const response = await genResponse(prompt, logs);

  logs.push({ type: "D", message: response });

  res.json({ logs });
});

app.get("/auth", (req, res) => {
  console.log(req.query);
  if (req.query.username === "admin" && req.query.password === "Welkom31401!") {
    res.json({ auth: authSecret });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

app.get("/authed", (req, res) => {
  if (req.query.auth === authSecret) {
    res.json({ authed: true });
  } else {
    res.json({ authed: false });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
