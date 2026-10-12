import { ConflictException, NotFoundException } from '../common/exceptions/http.exceptions';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/slug.util';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { ClinicResponseDto } from './dto/clinic-response.dto';

export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateClinicDto): Promise<ClinicResponseDto> {
    const slug = await this.ensureUniqueSlug(dto.slug ? slugify(dto.slug) : slugify(dto.name));

    try {
      const clinic = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.clinic.create({
          data: {
            name: dto.name,
            slug,
            phone: dto.phone,
            email: dto.email || null,
            address: dto.address || null,
            city: dto.city || null,
            region: dto.region || null,
            licenseNumber: dto.licenseNumber || null,
            logoUrl: dto.logoUrl || null,
            description: dto.description || null,
          },
        });

        await transaction.staffMember.create({
          data: {
            clinicId: created.id,
            userId,
            jobTitle: 'Clinic Administrator',
            isActive: true,
          },
        });

        return created;
      });

      return this.map(clinic);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async findMine(userId: string): Promise<ClinicResponseDto[]> {
    const memberships = await this.prisma.staffMember.findMany({
      where: { userId, isActive: true },
      include: { clinic: true },
    });

    return memberships
      .filter((membership) => membership.clinic.isActive)
      .map((membership) => this.map(membership.clinic));
  }

  async findOne(clinicId: string): Promise<ClinicResponseDto> {
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic || !clinic.isActive) {
      throw new NotFoundException('Clinic not found');
    }
    return this.map(clinic);
  }

  async update(clinicId: string, dto: UpdateClinicDto): Promise<ClinicResponseDto> {
    await this.findOne(clinicId);

    const data: Prisma.ClinicUpdateInput = {
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      region: dto.region,
      licenseNumber: dto.licenseNumber,
      logoUrl: dto.logoUrl,
      description: dto.description,
      isActive: dto.isActive,
    };

    if (dto.slug) {
      data.slug = await this.ensureUniqueSlug(slugify(dto.slug), clinicId);
    }

    try {
      const clinic = await this.prisma.clinic.update({
        where: { id: clinicId },
        data,
      });
      return this.map(clinic);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(clinicId: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(clinicId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.clinic.update({
        where: { id: clinicId },
        data: { isActive: false },
      });
      await transaction.staffMember.updateMany({
        where: { clinicId, isActive: true },
        data: { isActive: false },
      });
      await transaction.branch.updateMany({
        where: { clinicId, isActive: true },
        data: { isActive: false },
      });
      await transaction.doctor.updateMany({
        where: { clinicId, isActive: true },
        data: { isActive: false },
      });
    });
    return { success: true, message: 'Clinic deactivated successfully' };
  }

  async listPaginated(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<ClinicResponseDto>> {
    const where: Prisma.StaffMemberWhereInput = {
      userId,
      isActive: true,
      clinic: { isActive: true },
    };
    const [total, memberships] = await Promise.all([
      this.prisma.staffMember.count({ where }),
      this.prisma.staffMember.findMany({
        where,
        include: { clinic: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return new PaginatedResponseDto(
      memberships.map((membership) => this.map(membership.clinic)),
      total,
      page,
      limit,
    );
  }

  map(clinic: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string;
    address: string | null;
    city: string | null;
    region: string | null;
    licenseNumber: string | null;
    logoUrl: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ClinicResponseDto {
    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      email: clinic.email,
      phone: clinic.phone,
      address: clinic.address,
      city: clinic.city,
      region: clinic.region,
      licenseNumber: clinic.licenseNumber,
      logoUrl: clinic.logoUrl,
      description: clinic.description,
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }

  private async ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let suffix = 0;
    while (true) {
      const existing = await this.prisma.clinic.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) {
        return slug;
      }
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  private handleUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException('A clinic with this slug or license number already exists');
    }
    throw error;
  }
}
