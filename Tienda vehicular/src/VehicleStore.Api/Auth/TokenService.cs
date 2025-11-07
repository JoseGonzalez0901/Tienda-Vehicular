using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using VehicleStore.Core.Entities;

namespace VehicleStore.Api.Auth;

public interface ITokenService
{
    string Create(User user, IConfiguration cfg);
}

public class TokenService : ITokenService
{
    public string Create(User user, IConfiguration cfg)
    {
        var issuer = cfg["Jwt:Issuer"];
        var audience = cfg["Jwt:Audience"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("uid", user.Id.ToString())
        };
        var token = new JwtSecurityToken(issuer, audience, claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(cfg["Jwt:ExpiresMinutes"]!)),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
