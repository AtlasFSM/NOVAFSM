export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
    this.aggregateId = aggregateId;
  }

  abstract getEventName(): string;
}

export class JobCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly payload: { jobId: string; customerId: string; tenantId: string },
  ) {
    super(aggregateId);
  }
  getEventName() {
    return 'job.created';
  }
}

export class JobAssignedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly payload: { jobId: string; technicianId: string; tenantId: string },
  ) {
    super(aggregateId);
  }
  getEventName() {
    return 'job.assigned';
  }
}

export class QuoteApprovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly payload: {
      quoteId: string;
      customerId: string;
      total: number;
      tenantId: string;
    },
  ) {
    super(aggregateId);
  }
  getEventName() {
    return 'quote.approved';
  }
}
