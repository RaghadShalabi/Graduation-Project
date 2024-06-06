import 'dotenv/config';
import express from "express";
const app = express()
import initApp from "./src/modules/app.router.js";
const PORT = process.env.PORT || 3000;
initApp(app, express);


app.listen(PORT, () => {
    console.log(`server is running, on port ${PORT}`)
})



