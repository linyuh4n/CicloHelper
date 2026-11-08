namespace CicloHelper.Domain
{
    public abstract class BaseEntity
    {
        private readonly List<IDomainEvent> _domainEvents = new();

        public Guid Id { get; protected set; } = Guid.NewGuid();
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; protected set; }
        public DateTimeOffset? DeletedAt { get; protected set; }
        public bool IsDeleted { get; protected set; }

        public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

        internal void SetUpdatedAt() => UpdatedAt = DateTimeOffset.UtcNow;

        public void SoftDelete()
        {
            IsDeleted = true;
            DeletedAt = DateTimeOffset.UtcNow;
            SetUpdatedAt();
        }

        public void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

        public void ClearDomainEvents() => _domainEvents.Clear();
    }
}
