import { createApp } from './src/app';
import { validate } from './src/common/config/env.validation';

validate(process.env);

const { app } = createApp();

export default app;
