import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
  constructor(

  ) { }

  public nextAvailableDate(now: Date, availableHours: { start: Date; end: Date }): Date {
    const nextDate = new Date(now);
    const startTime = this.convertTimeToNumber(availableHours.start)
    const endTime = this.convertTimeToNumber(availableHours.end)

    // If the current time is past the available end time, set to next day
    if (now.getHours() > endTime) {
      nextDate.setDate(now.getDate() + 1);
      nextDate.setHours(startTime, 0, 0, 0);
    } else {
      // Set the time to the next available hour within the same day
      nextDate.setHours(startTime, 0, 0, 0);
    }

    return nextDate;
  }

  public differenceInMilliseconds(now: Date, future: Date): number {
    return future.getTime() - now.getTime();
  }

  public isWithinAvailableHours(now: Date, availableHours: { start: Date; end: Date }) {
    const hours = now.getHours();
    const startTime = this.convertTimeToNumber(availableHours.start)
    const endTime = this.convertTimeToNumber(availableHours.end)
    return hours >= startTime && hours <= endTime;
  }

  private convertTimeToNumber(date: Date): number {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * 60 + minutes;
  }
}


