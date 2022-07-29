import cors from 'cors'
import express from 'express'
import createError from 'http-errors'
import logger from 'morgan'
import bodyParser from 'body-parser'
import router from '../routes'


export const app = express()

/****************************************************
 Apply Middleware
 ****************************************************/
if (app.get('env') === 'development') {
  app.use(cors({origin: '*'}))
  app.use(logger('dev'))
}

app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(router)

/****************************************************
 Apply Routes
 ****************************************************/
app.use((req, res, next) => next(createError(404))) // throw 404 if route not found
