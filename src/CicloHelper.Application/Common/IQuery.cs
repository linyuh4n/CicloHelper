namespace CicloHelper.Application.Common
{
    public interface IQuery<TResponse> : MediatR.IRequest<TResponse>
    {
    }
}
