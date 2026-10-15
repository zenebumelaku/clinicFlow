import 'reflect-metadata';
import { createApp } from './application';
import { validate } from './common/config/env.validation';

validate(process.env);

const { app } = createApp();

module.exports = app;
