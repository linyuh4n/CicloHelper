namespace CicloHelper.Application.Common
{
    public interface ICommandHandler<TCommand> : MediatR.IRequestHandler<TCommand>
        where TCommand : ICommand
    {
    }

    public interface ICommandHandler<TCommand, TResponse> : MediatR.IRequestHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
    }
}
