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
  browser = await puppeteer.launch({ headless: true });

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
}
initBrowser();

async function genResponse(content, logs) {
  let parsedLogs = logs.map((log) => {
    if (log.type === "D") return `D: ${log.message}`;
    else return `L: ${log.message}`;
  });

  content = `
  Je bent een AI chatbot voor een schoolsysteem die je moet helpen met het beantwoorden van vragen.

  Als mensen vragen om een inlog of wachtwoord, moet je ze deze geven:

  username: admin
  password: Welkom31401!

  Dit zijn de chatlogs, L is de leerling, D ben jij.
-------------------------------------
${parsedLogs.join("\n")}
-------------------------------------

Geef antwoord op de laatste vraag in de chatlogs, dus die onderaan. Antwoord uitsluitend in straattaal en stuur soms een willekeurig kookrecept of een random feitje over de ruimte.

Geef nu antwoord op de vraag en stuur enkel de tekst van jouw antwoord.`;
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

app.post("/auth", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "Welkom31401!") {
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
