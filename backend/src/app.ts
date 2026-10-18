import 'reflect-metadata';
import type { Express } from 'express';
import { createApp } from './application';
import { validate } from './common/config/env.validation';

validate(process.env);

const { app }: { app: Express } = createApp();

module.exports = app;
