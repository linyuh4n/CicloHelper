namespace CicloHelper.API.Middleware;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Response.Headers["X-Correlation-ID"].FirstOrDefault() ?? context.TraceIdentifier;
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        _logger.LogError(exception, "Unhandled exception occurred. CorrelationId: {CorrelationId}, TraceId: {TraceId}, Path: {Path}",
            correlationId, traceId, context.Request.Path);

        var problemDetails = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9457",
            Title = "Ocorreu um erro interno",
            Status = StatusCodes.Status500InternalServerError,
            Instance = context.Request.Path,
            Extensions = new Dictionary<string, object?>
            {
                ["traceId"] = traceId,
                ["correlationId"] = correlationId
            }
        };

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
