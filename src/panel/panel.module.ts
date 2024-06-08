import { Module } from '@nestjs/common';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { NotifyModule } from 'src/notify/notify.module';

@Module({
  imports: [NotifyModule],
  controllers: [PanelController],
  providers: [PanelService]
})
export class PanelModule {}
