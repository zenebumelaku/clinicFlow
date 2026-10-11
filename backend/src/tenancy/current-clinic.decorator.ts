import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Clinic, StaffMember } from '@prisma/client';

export const CurrentClinic = createParamDecorator(
  (data: keyof Clinic | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const clinic = request.clinic as Clinic | undefined;
    return data && clinic ? clinic[data] : clinic;
  },
);

export const CurrentStaffMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StaffMember | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.staffMember as StaffMember | undefined;
  },
);
