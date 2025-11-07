using System.Text;
using System.Collections.Generic;                    // ← para List<string>
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VehicleStore.Api.Auth;                         // ITokenService / TokenService
using VehicleStore.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ───────────────────────────────────────────────────────────────────────────────
// DB: Azure SQL (SQL Server)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null) // resiliencia Azure
    )
);

// ───────────────────────────────────────────────────────────────────────────────
// Controllers + Swagger (con JWT en Swagger)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SupportNonNullableReferenceTypes();

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT en el header Authorization. Ej: Bearer {token}",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// CORS (ajusta orígenes si luego quieres restringir)
builder.Services.AddCors(opt => opt.AddPolicy("ui",
    p => p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));

// ───────────────────────────────────────────────────────────────────────────────
// Auth/JWT
builder.Services.AddScoped<ITokenService, TokenService>();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("Falta Jwt:Key en configuración.");
}
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ───────────────────────────────────────────────────────────────────────────────
// ...arriba sin cambios

// HTTPS, estáticos, CORS…
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("ui");

// ⬇️ Habilitar SIEMPRE, no solo en Development ni por flag
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "VehicleStore API v1");
    c.RoutePrefix = "swagger"; // /swagger
});

// Migraciones, auth y endpoints
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/app/"));
app.MapControllers();

app.UseDefaultFiles(new DefaultFilesOptions { DefaultFileNames = new List<string> { "app/index.html" } });
app.MapFallbackToFile("/app/{*path:nonfile}", "app/index.html");

app.Run();

