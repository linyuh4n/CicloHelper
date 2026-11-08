namespace CicloHelper.API.Controllers;

using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public sealed class PingController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PingResponse), StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        return Ok(new PingResponse
        {
            Message = "pong",
            Timestamp = DateTimeOffset.UtcNow,
            Version = "1.0.0"
        });
    }
}

public sealed record PingResponse
{
    public string Message { get; init; } = string.Empty;
    public DateTimeOffset Timestamp { get; init; }
    public string Version { get; init; } = string.Empty;
}
