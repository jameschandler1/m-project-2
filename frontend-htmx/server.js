import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "../backend/.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| Base path
|--------------------------------------------------------------------------
|
| Local:
| http://localhost:3000/
|
| Production:
| BASE_PATH=/htmx
| http://18.119.176.95/htmx/
|
*/

const BASE_PATH = process.env.BASE_PATH || "";

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(
    session({
        secret: process.env.SESSION_SECRET || "htmx-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
        },
    })
);

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/

app.use(
    BASE_PATH,
    express.static(path.join(__dirname, "public"))
);

/*
|--------------------------------------------------------------------------
| API Proxy
|--------------------------------------------------------------------------
*/

app.use(`${BASE_PATH}/api`, async (req, res) => {

    const backendUrl =
        `http://127.0.0.1:4000${req.originalUrl.replace(BASE_PATH, "")}`;

    try {

        const headers = {};

        if (req.headers.cookie) {
            headers.Cookie = req.headers.cookie;
        }

        if (
            req.headers["content-type"] &&
            !req.headers["content-type"].includes("multipart/form-data")
        ) {
            headers["Content-Type"] = req.headers["content-type"];
        }

        let body;

        if (
            req.method !== "GET" &&
            req.method !== "HEAD"
        ) {

            if (
                req.headers["content-type"]?.includes("multipart/form-data")
            ) {

                const chunks = [];

                for await (const chunk of req) {
                    chunks.push(chunk);
                }

                body = Buffer.concat(chunks);

                headers["Content-Type"] =
                    req.headers["content-type"];

            } else {

                body = JSON.stringify(req.body);

            }
        }

        const response = await fetch(backendUrl, {
            method: req.method,
            headers,
            body,
        });

        const setCookie = response.headers.get("set-cookie");

        if (setCookie) {
            res.setHeader("Set-Cookie", setCookie);
        }

        const contentType =
            response.headers.get("content-type") || "";

        res.status(response.status);

        if (contentType.includes("application/json")) {

            const json = await response.json();

            return res.json(json);

        }

        const buffer = Buffer.from(await response.arrayBuffer());

        return res.send(buffer);

    } catch (err) {

        console.error("Proxy error:", err);

        return res.status(500).json({
            error: "Proxy failed",
        });

    }

});

/*
|--------------------------------------------------------------------------
| HTML Routes
|--------------------------------------------------------------------------
*/

function sendView(res, file) {

    const stripeKey =
        process.env.STRIPE_PUBLISHABLE_KEY || "";

    let html = fs.readFileSync(
        path.join(__dirname, "views", file),
        "utf8"
    );

    html = html.replace(
        '<meta name="base-path" content="">',
        `<meta name="base-path" content="${BASE_PATH}">`
    );

    html = html.replace(
        '<meta name="stripe-publishable-key" content="">',
        `<meta name="stripe-publishable-key" content="${stripeKey}">`
    );

    res.send(html);

}

app.get(`${BASE_PATH}/`, (req, res) => {

    sendView(res, "index.html");

});

app.get(`${BASE_PATH}/login`, (req, res) => {

    res.sendFile(
        path.join(__dirname, "views", "login.html")
    );

});

app.get(`${BASE_PATH}/dashboard`, (req, res) => {

    res.sendFile(
        path.join(__dirname, "views", "dashboard.html")
    );

});

app.get(`${BASE_PATH}/payment`, (req, res) => {

    res.sendFile(
        path.join(__dirname, "views", "payment.html")
    );

});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {

    console.log("");
    console.log("==================================");
    console.log("HTMX Frontend Running");
    console.log("==================================");
    console.log(`PORT: ${PORT}`);
    console.log(`BASE_PATH: "${BASE_PATH}"`);
    console.log("");

});