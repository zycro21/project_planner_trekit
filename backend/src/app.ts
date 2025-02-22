import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "./config/corsConfig";

const App: Express = express();

// Middleware awal
App.use(cors);
App.use(cookieParser());
App.use(express.json());
App.use(express.urlencoded({ extended: true}));

// Routing Placeholder
// Testing
App.get('/', (req: Request, res: Response) => {
    res.send('Welcome to this API!');
});

export default App;