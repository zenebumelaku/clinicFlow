import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto, PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clinicId: string, dto: CreateBranchDto): Promise<BranchResponseDto> {
    try {
      const branch = await this.prisma.branch.create({
        data: {
          clinicId,
          name: dto.name,
          code: dto.code,
          phone: dto.phone || null,
          email: dto.email || null,
          address: dto.address || null,
          city: dto.city || null,
        },
      });
      return this.map(branch);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async findAll(
    clinicId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<BranchResponseDto>> {
    const where: Prisma.BranchWhereInput = {
      clinicId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.branch.count({ where }),
      this.prisma.branch.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PaginatedResponseDto(
      records.map((b) => this.map(b)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(clinicId: string, branchId: string): Promise<BranchResponseDto> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clinicId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found in this clinic');
    }
    return this.map(branch);
  }

  async update(
    clinicId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    await this.findOne(clinicId, branchId);
    try {
      const branch = await this.prisma.branch.update({
        where: { id: branchId },
        data: {
          name: dto.name,
          code: dto.code,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          city: dto.city,
          isActive: dto.isActive,
        },
      });
      return this.map(branch);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(clinicId: string, branchId: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(clinicId, branchId);
    await this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false },
    });
    return { success: true, message: 'Branch deactivated successfully' };
  }

  async assertBranchInClinic(clinicId: string, branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clinicId, isActive: true },
    });
    if (!branch) {
      throw new BadRequestException('Branch does not belong to this clinic');
    }
  }

  map(branch: {
    id: string;
    clinicId: string;
    name: string;
    code: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BranchResponseDto {
    return { ...branch };
  }

  private handleUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException('A branch with this code already exists in the clinic');
    }
    throw error;
  }
}
