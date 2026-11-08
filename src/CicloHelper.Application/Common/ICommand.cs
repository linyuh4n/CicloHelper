namespace CicloHelper.Application.Common
{
    public interface ICommand : MediatR.IRequest
    {
    }

    public interface ICommand<TResponse> : MediatR.IRequest<TResponse>
    {
    }
}
