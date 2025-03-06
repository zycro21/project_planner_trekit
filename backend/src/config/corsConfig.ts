import cors from "cors";

const allowedOrigins = [
    'http://localhost:3000',
];

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS is not allowed this origins'));
        }
    },
    credentials: true, // for cookie/token
};

export default cors(corsOptions);