using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using VehicleStore.Core.Entities;
using VehicleStore.Infrastructure.Data;


namespace VehicleStore.Api.Controllers;

[ApiController]
[Route("api/vehicles/admin")]
public class VehiclesAdminController(AppDbContext db) : ControllerBase
{
    // ------- DTOs de entrada -------
    public record SpecsInput(
        string? Engine,
        string? Drive,
        int? PowerHp,
        int? TorqueNm,
        string? Consumption,
        int? Doors,
        int? Seats,
        int? MileageKm,
        string? Description,
        List<string>? Accessories,
        List<string>? Features,
        string? Location,
         string? Type ,
         string Condition// <-- NUEVO
    );

    public record MediaInput(
        List<string>? Gallery,      // rutas relativas o absolutas
        string? VideoUrl,
        string? Model3DUrl
    );

    public record QuickCreateDto(
        string BrandName,
        string ModelName,
        int Year,
        decimal Price,
        string Fuel = "Gasolina",
        string Transmission = "AT",
        string? Color = null,
        bool IsFeatured = true,
        SpecsInput? Specs = null,
        MediaInput? Media = null
    );

    // ====== CREATE ======
    [Authorize(Roles = "Admin")]
    [HttpPost("quick-create")]
    public async Task<IActionResult> QuickCreate([FromBody] QuickCreateDto dto, CancellationToken ct)
    {
        // ---- Upsert Brand ----
        var brand = await db.Brands
            .FirstOrDefaultAsync(b => b.Name == dto.BrandName, ct)
            ?? db.Brands.Add(new Brand { Name = dto.BrandName }).Entity;

        // ---- Upsert Model ----
        var model = await db.VehicleModels
            .FirstOrDefaultAsync(m => m.Name == dto.ModelName && m.BrandId == brand.Id, ct)
            ?? db.VehicleModels.Add(new VehicleModel { Name = dto.ModelName, Brand = brand }).Entity;

        // ---- Crear Vehicle ----
        var vehicle = new Vehicle
        {
            Model = model,
            Year = dto.Year,
            Price = dto.Price,
            Fuel = dto.Fuel,
            Transmission = dto.Transmission,
            Color = dto.Color,
            IsFeatured = dto.IsFeatured
        };

        // ---- Specs (clave-valor) ----
        if (dto.Specs is not null)
        {
            void AddSpec(string key, string? value)
            {
                if (!string.IsNullOrWhiteSpace(value))
                    vehicle.Specs.Add(new VehicleSpec { Key = key, Value = value });
            }
            AddSpec("engine", dto.Specs.Engine);
            AddSpec("drive", dto.Specs.Drive);
            AddSpec("type", dto.Specs?.Type);
            AddSpec("consumption", dto.Specs.Consumption);
            AddSpec("condition", dto.Specs.Condition);
            AddSpec("description", dto.Specs.Description);
            AddSpec("location", dto.Specs.Location);
            if (dto.Specs.PowerHp is int hp) AddSpec("powerHp", hp.ToString());
            if (dto.Specs.TorqueNm is int tq) AddSpec("torqueNm", tq.ToString());
            if (dto.Specs.Doors is int doors) AddSpec("doors", doors.ToString());
            if (dto.Specs.Seats is int seats) AddSpec("seats", seats.ToString());
            if (dto.Specs.MileageKm is int km) AddSpec("mileageKm", km.ToString());
            if (dto.Specs.Accessories?.Count > 0) AddSpec("accessories", string.Join(",", dto.Specs.Accessories));
            if (dto.Specs.Features?.Count > 0) AddSpec("features", string.Join(",", dto.Specs.Features));
        }

        // ---- Media ----
        if (dto.Media is not null)
        {
            if (dto.Media.Gallery?.Count > 0)
            {
                for (int i = 0; i < dto.Media.Gallery.Count; i++)
                {
                    var url = dto.Media.Gallery[i];
                    if (string.IsNullOrWhiteSpace(url)) continue;
                    vehicle.Media.Add(new MediaAsset
                    {
                        Type = "image",
                        Url = url,
                        Order = i,
                        IsCover = (i == 0)
                    });
                }
            }
            if (!string.IsNullOrWhiteSpace(dto.Media.VideoUrl))
            {
                vehicle.Media.Add(new MediaAsset { Type = "video", Url = dto.Media.VideoUrl!, Order = 1000 });
            }
            if (!string.IsNullOrWhiteSpace(dto.Media.Model3DUrl))
            {
                vehicle.Media.Add(new MediaAsset { Type = "model3d", Url = dto.Media.Model3DUrl!, Order = 2000 });
            }
        }

        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync(ct);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return Created($"/api/vehicles/{vehicle.Id}", vehicle.ToDetailDto(baseUrl));
    }

    // ====== UPDATE ======
    public record UpdateSpecsDto(
        string? Engine,
        string? Drive,
        int? PowerHp,
        int? TorqueNm,
        string? Consumption,
        int? Doors,
        int? Seats,
        int? MileageKm,
        string? Description,
        List<string>? Accessories,
        List<string>? Features,
        string? Location,
        string? Type,
        string? condition
    );

    public record UpdateVehicleDto(
        string? BrandName,
        string? ModelName,
        int? Year,
        decimal? Price,
        string? Fuel,
        string? Transmission,
        string? Color,
        bool? IsFeatured,
        UpdateSpecsDto? Specs
    );

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VehicleDetailDto>> Update([FromRoute] int id, [FromBody] UpdateVehicleDto dto, CancellationToken ct)
    {
        var v = await db.Vehicles
            .Include(x => x.Model).ThenInclude(m => m.Brand)
            .Include(x => x.Specs)
            .Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (v is null) return NotFound();

        // Cambiar Brand/Model si vienen
        if (!string.IsNullOrWhiteSpace(dto.BrandName) || !string.IsNullOrWhiteSpace(dto.ModelName))
        {
            if (!string.IsNullOrWhiteSpace(dto.BrandName))
            {
                var brand = await db.Brands.FirstOrDefaultAsync(b => b.Name == dto.BrandName, ct)
                            ?? db.Brands.Add(new Brand { Name = dto.BrandName! }).Entity;

                if (!string.IsNullOrWhiteSpace(dto.ModelName))
                {
                    var model = await db.VehicleModels
                        .FirstOrDefaultAsync(m => m.Name == dto.ModelName && m.BrandId == brand.Id, ct)
                        ?? db.VehicleModels.Add(new VehicleModel { Name = dto.ModelName!, Brand = brand }).Entity;

                    v.Model = model;
                }
                else
                {
                    // misma denominación de modelo, nueva marca
                    var model = await db.VehicleModels
                        .FirstOrDefaultAsync(m => m.Name == v.Model.Name && m.BrandId == brand.Id, ct)
                        ?? db.VehicleModels.Add(new VehicleModel { Name = v.Model.Name, Brand = brand }).Entity;

                    v.Model = model;
                }
            }
            else if (!string.IsNullOrWhiteSpace(dto.ModelName))
            {
                var model = await db.VehicleModels
                    .FirstOrDefaultAsync(m => m.Name == dto.ModelName && m.BrandId == v.Model.BrandId, ct)
                    ?? db.VehicleModels.Add(new VehicleModel { Name = dto.ModelName!, BrandId = v.Model.BrandId }).Entity;

                v.Model = model;
            }
        }

        // Escalares
        if (dto.Year.HasValue) v.Year = dto.Year.Value;
        if (dto.Price.HasValue) v.Price = dto.Price.Value;
        if (dto.Fuel is not null) v.Fuel = dto.Fuel;
        if (dto.Transmission is not null) v.Transmission = dto.Transmission;
        if (dto.Color is not null) v.Color = dto.Color;
        if (dto.IsFeatured.HasValue) v.IsFeatured = dto.IsFeatured.Value;

        // Specs (upsert / remove si envías vacío explícito)
        if (dto.Specs is not null)
        {
            void Upsert(string key, string? value)
            {
                var s = v.Specs.FirstOrDefault(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
                if (value is null) return; // null => no tocar
                if (string.IsNullOrWhiteSpace(value))
                {
                    if (s is not null) db.VehicleSpecs.Remove(s); // "" => borrar
                }
                else
                {
                    if (s is null) v.Specs.Add(new VehicleSpec { Key = key, Value = value });
                    else s.Value = value;
                }
            }

            // strings
            Upsert("engine", dto.Specs.Engine);
            Upsert("drive", dto.Specs.Drive);
            Upsert("type", dto.Specs?.Type);
            Upsert("condition", dto.Specs?.condition);
            Upsert("consumption", dto.Specs.Consumption);
            Upsert("description", dto.Specs.Description);
            Upsert("location", dto.Specs.Location);

            // ints
            if (dto.Specs.PowerHp.HasValue) Upsert("powerHp", dto.Specs.PowerHp.Value.ToString());
            if (dto.Specs.TorqueNm.HasValue) Upsert("torqueNm", dto.Specs.TorqueNm.Value.ToString());
            if (dto.Specs.Doors.HasValue) Upsert("doors", dto.Specs.Doors.Value.ToString());
            if (dto.Specs.Seats.HasValue) Upsert("seats", dto.Specs.Seats.Value.ToString());
            if (dto.Specs.MileageKm.HasValue) Upsert("mileageKm", dto.Specs.MileageKm.Value.ToString());

            // listas → CSV (null = no tocar, [] = borrar)
            if (dto.Specs.Accessories is not null)
                Upsert("accessories", dto.Specs.Accessories.Count == 0 ? "" : string.Join(",", dto.Specs.Accessories));
            if (dto.Specs.Features is not null)
                Upsert("features", dto.Specs.Features.Count == 0 ? "" : string.Join(",", dto.Specs.Features));
        }

        await db.SaveChangesAsync(ct);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return Ok(v.ToDetailDto(baseUrl));
    }

    // ====== DELETE ======
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
    {
        var v = await db.Vehicles
            .Include(x => x.Media)
            .Include(x => x.Specs)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (v is null) return NotFound();

        db.Vehicles.Remove(v); // FK cascade elimina Media y Specs
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
