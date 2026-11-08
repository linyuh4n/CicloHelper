namespace CicloHelper.Domain
{
    public abstract record DomainEvent : IDomainEvent
    {
        public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
        public Guid EventId { get; init; } = Guid.NewGuid();
    }
}
