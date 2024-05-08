/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateStatusDTO } from './status.dto';

@Injectable()
export class StatusService {
  constructor(private readonly dbService: DbService) {}

  async getStatus(domainID: string) {
    try {
      const status = await this.dbService.status.findMany({ where: { domainId: domainID } });
      return status;
    } catch (error) {
      throw new InternalServerErrorException('Cannot get status')
    }
  }

  async createStatus(domainID: string, dto: CreateStatusDTO) {
    try {
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

      if(!existingCompletedStatus) {
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

    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Status cannot be created!')
    }
  }

  async editStatus(statusID: string, domainId: string, dto: CreateStatusDTO) {
    try {
      const existingStatus = await this.dbService.status.findUnique({
        where: {
          id: statusID,
          domainId,
        }
      })

      if(!existingStatus) throw new NotFoundException('Status not found')
      
      await this.dbService.status.update({ where: { id: statusID, domainId: domainId }, data: { ...dto } });
      return new HttpException('Updated', HttpStatus.ACCEPTED)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteStatus(statusID: string, domainId: string) {
    try {
      const existingStatus = await this.dbService.status.findUnique({
        where: {
          id: statusID,
          domainId,
        }
      })

      if(!existingStatus) throw new NotFoundException('Status not found')

      await this.dbService.status.delete({ where: { id: statusID, domainId, } });
      return new HttpException('Deleted', HttpStatus.ACCEPTED)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
    
  }
}
