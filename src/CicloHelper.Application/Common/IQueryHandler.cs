namespace CicloHelper.Application.Common
{
    public interface IQueryHandler<TQuery, TResponse> : MediatR.IRequestHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
    }
}
