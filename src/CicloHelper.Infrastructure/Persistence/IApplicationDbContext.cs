namespace CicloHelper.Infrastructure.Persistence
{
    using Microsoft.EntityFrameworkCore;

    public interface IApplicationDbContext
    {
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
