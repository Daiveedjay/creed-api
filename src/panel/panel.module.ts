import { Module } from '@nestjs/common';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { BullModule } from '@nestjs/bull';
@Module({

  imports: [
    BullModule.registerQueueAsync({
      name: 'emailQueue'
    })
  ],
  controllers: [PanelController],
  providers: [PanelService]
})
export class PanelModule { }
