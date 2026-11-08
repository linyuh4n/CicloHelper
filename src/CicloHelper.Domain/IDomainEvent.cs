namespace CicloHelper.Domain
{
    public interface IDomainEvent
    {
        DateTimeOffset OccurredAt { get; }
        Guid EventId { get; }
    }
}
