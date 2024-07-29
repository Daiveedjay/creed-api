/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateStatusDTO } from './status.dto';

@Injectable()
export class StatusService {
  constructor(
    private readonly dbService: DbService
  ) { }

  async getStatus(domainID: string) {
    const status = await this.dbService.status.findMany({ where: { domainId: domainID } });
    return status;
  }

  async createStatus(domainID: string, dto: CreateStatusDTO) {
    const transaction: any[] = await this.dbService.$transaction([])

    const existingStatuses = await this.dbService.status.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const completedIndex = existingStatuses.findIndex(
      (status) => status.name === 'completed' && status.domainId === domainID,
    );

    const existingCompletedStatus = await this.dbService.status.findFirst({
      where: {
        name: 'completed',
        domainId: domainID
      }
    })

    if (existingCompletedStatus && completedIndex !== -1) {
      const newStatus = this.dbService.status.create({
        data: {
          name: dto.name,
          domainId: domainID
        },
      });

      transaction.push(
        this.dbService.status.update({
          where: { id: existingStatuses[completedIndex].id },
          data: { createdAt: new Date() },
        }),
      );
      transaction.unshift(newStatus);
    }

    if (!existingCompletedStatus) {
      const newCompletedStatus = this.dbService.status.create({
        data: {
          name: 'completed',
          domainId: domainID
        },
      });

      transaction.push(newCompletedStatus);

      const newStatus = this.dbService.status.create({
        data: {
          name: dto.name,
          domainId: domainID
        },
      });

      transaction.unshift(newStatus);
    }


    await this.dbService.$transaction(transaction);

    return new HttpException('Created', HttpStatus.CREATED);

  }

  async createMultipleStatus(domainID: string, dto: CreateStatusDTO[]) {
    for (const newStatus of dto) {
      await this.createStatus(domainID, newStatus)
    }
  }

  async editStatus(statusID: string, domainId: string, dto: CreateStatusDTO) {
    const existingStatus = await this.dbService.status.findUnique({
      where: {
        id: statusID,
        domainId,
      }
    })

    if (!existingStatus) throw new NotFoundException('Status not found')

    await this.dbService.status.update({ where: { id: statusID, domainId: domainId }, data: { ...dto } });
    return new HttpException('Updated', HttpStatus.ACCEPTED)

  }

  async deleteStatus(statusID: string, domainId: string) {
    const existingStatus = await this.dbService.status.findUnique({
      where: {
        id: statusID,
        domainId,
      },
      include: {
        tasks: true
      }
    })

    if (!existingStatus) throw new NotFoundException('Status not found')

    for (const task of existingStatus.tasks) {
      await this.dbService.task.delete({
        where: {
          id: task.id,
        }
      })
    }

    await this.dbService.status.delete({ where: { id: statusID, domainId, } });
    return new HttpException('Deleted', HttpStatus.ACCEPTED)


  }
}
