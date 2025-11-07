using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Infrastructure.Data;
using VehicleStore.Core.Entities;
using BCrypt.Net;
using VehicleStore.Api.Auth;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, IConfiguration cfg, ITokenService tokens) : ControllerBase
{
    public record RegisterDto(string Email, string Password, string Role = "Agent");
    public record LoginDto(string Email, string Password);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict("Email already registered");

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Created($"/api/users/{user.Id}", new { user.Id, user.Email, user.Role });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var jwt = tokens.Create(user, cfg);
        return Ok(new { token = jwt, role = user.Role, email = user.Email });
    }
}
