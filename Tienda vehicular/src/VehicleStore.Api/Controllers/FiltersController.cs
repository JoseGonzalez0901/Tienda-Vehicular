using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleStore.Infrastructure.Data;
using VehicleStore.Core.Entities;

namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FiltersController(AppDbContext db) : ControllerBase
{
    public sealed record FiltersDto(
        IReadOnlyList<string> Types,
        IReadOnlyList<string> Brands,
        IReadOnlyList<string> Models,
        IReadOnlyList<int> Years,
        IReadOnlyList<string> Provinces
    );

    /// <summary>
    /// Devuelve opciones para filtros: tipos, marcas, modelos, años, provincias.
    /// Puedes pasar ?brand=Chevrolet para que los modelos vengan filtrados por esa marca.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<FiltersDto>> Get([FromQuery] string? brand = null, CancellationToken ct = default)
    {
        // Tipos: estáticos (ajústalos a tu taxonomía del front)
        var types = new[] { "carro" , "suv" , "motocicleta"  ,"camioneta" };

        // Marcas
        var brands = await db.Brands.AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => b.Name)
            .ToListAsync(ct);

        // Modelos (opcionalmente filtrados por marca)
        IQueryable<VehicleModel> modelsQ = db.VehicleModels.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(brand))
        {
            modelsQ = modelsQ.Where(m => m.Brand.Name == brand);
        }

        var models = await modelsQ
            .OrderBy(m => m.Name)
            .Select(m => m.Name)
            .Distinct()
            .ToListAsync(ct);

        // Años (distintos, descendente)
        var years = await db.Vehicles.AsNoTracking()
            .Select(v => v.Year)
            .Distinct()
            .OrderByDescending(y => y)
            .ToListAsync(ct);

        // Provincias/Ubicaciones: desde VehicleSpec con Key="location" (según cómo guardaste en quick-create)
        var provinces = await db.VehicleSpecs.AsNoTracking()
            .Where(s => s.Key == "location" && s.Value != null && s.Value != "")
            .Select(s => s.Value!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);

        return Ok(new FiltersDto(types, brands, models, years, provinces));
    }
}
