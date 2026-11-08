namespace CicloHelper.API.Middleware;

using Serilog.Core;
using Serilog.Events;
using Serilog.Context;

public sealed class CorrelationIdEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        // The CorrelationId is already added to LogContext via CorrelationIdMiddleware
        // Serilog automatically enriches log events with properties from LogContext
        // This enricher is kept for explicit control if needed in the future
    }
}
