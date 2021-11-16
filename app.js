import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cheerio from 'cheerio';
import indexRouter from './routes/index.js';
import apiRouter from './routes/apiv1.js';
import apiRouter2 from './routes/v2/apiv2.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import sessions from 'express-session';
import MsIdExpress from 'microsoft-identity-express'

const appSettings = {
    appCredentials: {
        clientId: "59f2c9b1-b06b-4849-923c-441405d4160b", // Application (client) ID on Azure AD
        tenantId: "f6b6dd5b-f02f-441a-99a0-162ac5060bd2", // alt. "common" "organizations" "consumers"
        clientSecret: "VIe7Q~6gkdxfi41RGm.s2pjupc6Tve5PJ2fmP" // alt. client certificate or key vault credential
    },
    authRoutes: {
        redirect: "https://webpreview.justinbanusing.com/redirect",
        error: "/error", // the wrapper will redirect to this route in case of any error.
        unauthorized: "/unauthorized" // the wrapper will redirect to this route in case of unauthorized access attempt.
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const oneDay = 1000 * 60 * 60 * 24;

app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}))

// instantiate the MS auth wrapper
const msid = new MsIdExpress.WebAppAuthClientBuilder(appSettings).build();
// initialize the MS auth wrapper
app.use(msid.initialize());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1', apiRouter)
app.use('/api/v2', apiRouter2)

// authentication routes
app.get('/signin', 
    msid.signIn({
        postLoginRedirect: '/'
    }
));

app.get('/signout', 
    msid.signOut({
        postLogoutRedirect: '/'
    }
));

// unauthorized
app.get('/error', (req, res) => res.status(500).send('server error'));

// error
app.get('/unauthorized', (req, res) => res.status(401).send('permission denied'));
  
export default app;
