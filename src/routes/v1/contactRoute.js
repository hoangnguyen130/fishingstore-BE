import express from 'express'
import { addNewContact, fetchContacts } from '~/controllers/contactController'

const Router = express.Router()

Router.post('/:userId', addNewContact)

Router.get('/:userId', fetchContacts)

export const contactRoute = Router
