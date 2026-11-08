namespace CicloHelper.API.Middleware;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

public sealed class ValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    e => e.Key,
                    e => e.Value!.Errors.Select(err => err.ErrorMessage).ToArray()
                );

            var problemDetails = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc9457",
                Title = "Erro de validação",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Um ou mais erros de validação ocorreram.",
                Instance = context.HttpContext.Request.Path,
                Extensions = new Dictionary<string, object?>
                {
                    ["errors"] = errors,
                    ["traceId"] = context.HttpContext.TraceIdentifier
                }
            };

            context.Result = new BadRequestObjectResult(problemDetails);
            return;
        }

        await next();
    }
}
