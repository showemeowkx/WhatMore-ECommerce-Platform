import { Controller, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class NotificationsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('admin-events')
  adminEvents(): Observable<MessageEvent> {
    const orderCreated$ = fromEvent(this.eventEmitter, 'order.created').pipe(
      map(() => ({ data: { type: 'NEW_ORDER' } }) as MessageEvent),
    );

    const keepAlive$ = interval(15000).pipe(
      map(() => ({ data: { type: 'PING' } }) as MessageEvent),
    );

    return merge(orderCreated$, keepAlive$);
  }
}
