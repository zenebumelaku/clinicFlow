import { Router } from 'express';
import { AppServices } from '../services';
import { createAuthMiddleware } from '../auth/middlewares/auth.middleware';
import { validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { NotificationQueryDto } from './dto/notification-query.dto';

export function createNotificationsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);

  router.get(
    '/',
    authenticate,
    validateQuery(NotificationQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as NotificationQueryDto;
        const result = await services.notifications.findAll(req.user!.id, query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:notificationId/read',
    authenticate,
    validateUuidParam('notificationId'),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.notifications.markRead(
          req.user!.id,
          clinicId,
          req.params.notificationId,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
